package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentWorkflowHistory;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.DocumentStatus;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.dto.DocumentResponse;
import com.digitalarchive.dto.WorkflowHistoryResponse;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.DocumentRepository;
import com.digitalarchive.repository.DocumentWorkflowHistoryRepository;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The document state machine. Allowed transitions, per your original design:
 * DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> ARCHIVED
 * -> REJECTED -> DRAFT (resubmit)
 */
@Service
@RequiredArgsConstructor
public class DocumentWorkflowService {

    private final DocumentRepository documentRepository;
    private final DocumentWorkflowHistoryRepository historyRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;
    private final ApiResponseMapper responseMapper;

    private static final Map<DocumentStatus, Set<DocumentStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(
            DocumentStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(DocumentStatus.DRAFT, EnumSet.of(DocumentStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(DocumentStatus.SUBMITTED, EnumSet.of(DocumentStatus.UNDER_REVIEW));
        ALLOWED_TRANSITIONS.put(DocumentStatus.UNDER_REVIEW,
                EnumSet.of(DocumentStatus.APPROVED, DocumentStatus.REJECTED, DocumentStatus.DRAFT));
        ALLOWED_TRANSITIONS.put(DocumentStatus.REJECTED, EnumSet.of(DocumentStatus.DRAFT));
        ALLOWED_TRANSITIONS.put(DocumentStatus.APPROVED, EnumSet.of(DocumentStatus.ARCHIVED));
        ALLOWED_TRANSITIONS.put(DocumentStatus.ARCHIVED, EnumSet.noneOf(DocumentStatus.class));
    }

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> history(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        return historyRepository.findByDocument_DocumentIdOrderByChangedAtDesc(document.getDocumentId()).stream()
                .map(responseMapper::toWorkflowHistoryResponse)
                .toList();
    }

    @Transactional
    public DocumentResponse transition(UUID documentId, DocumentStatus targetStatus, com.digitalarchive.dto.TransitionRequest request, UUID actorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (document.getDeletedAt() != null) {
            throw new IllegalStateException("Cannot transition a deleted document");
        }

        if (targetStatus == DocumentStatus.UNDER_REVIEW
                || targetStatus == DocumentStatus.APPROVED
                || targetStatus == DocumentStatus.REJECTED
                || (targetStatus == DocumentStatus.DRAFT && document.getStatus() == DocumentStatus.UNDER_REVIEW)) {
            appUserRepository.findById(actorId)
                    .filter(user -> user.getDepartment() != null
                            && document.getDepartment() != null
                            && user.getDepartment().getDepartmentId().equals(document.getDepartment().getDepartmentId()))
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException(
                            "Department managers may only review documents in their department"));
        }

        DocumentStatus currentStatus = document.getStatus();
        Set<DocumentStatus> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!allowedNext.contains(targetStatus)) {
            throw new IllegalStateException(
                    "Cannot transition from " + currentStatus + " to " + targetStatus +
                            ". Allowed: " + allowedNext);
        }

        String comment = request == null ? null : request.getComment();
        if (targetStatus == DocumentStatus.REJECTED && (comment == null || comment.isBlank())) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        if (targetStatus == DocumentStatus.DRAFT && currentStatus == DocumentStatus.UNDER_REVIEW) {
            if (request == null || request.getAmendmentSections() == null
                    || request.getAmendmentSections().stream().filter(value -> value != null && !value.isBlank()).toList().isEmpty()) {
                throw new IllegalArgumentException("At least one amendment section is required");
            }
            if (request.getAmendmentComment() == null || request.getAmendmentComment().isBlank()) {
                throw new IllegalArgumentException("An amendment comment is required");
            }
        }
        if (targetStatus == DocumentStatus.DRAFT && currentStatus == DocumentStatus.REJECTED
                && !document.getCreatedBy().equals(actorId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the original uploader may start edits on a rejected document");
        }
        if (targetStatus == DocumentStatus.SUBMITTED && currentStatus == DocumentStatus.DRAFT
                && !document.getCreatedBy().equals(actorId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the original uploader may submit a draft for review");
        }
        if (targetStatus == DocumentStatus.ARCHIVED
                && (request == null || request.getClassification() == null)) {
            throw new IllegalArgumentException("A classification is required before archiving");
        }

        // Record history BEFORE changing status, so from/to reflects the real
        // transition
        DocumentWorkflowHistory history = DocumentWorkflowHistory.builder()
                .document(document)
                .fromStatus(currentStatus)
                .toStatus(targetStatus)
                .comment(comment)
                .amendmentSections(request == null || request.getAmendmentSections() == null
                        ? null : request.getAmendmentSections().stream().filter(value -> value != null && !value.isBlank()).collect(Collectors.joining(",")))
                .amendmentComment(request == null ? null : request.getAmendmentComment())
                .rejectionReason(targetStatus == DocumentStatus.REJECTED ? comment : null)
                .changedBy(actorId)
                .build();
        historyRepository.save(history);

        document.setStatus(targetStatus);
        document.setUpdatedBy(actorId);
        if (targetStatus == DocumentStatus.REJECTED) {
            document.setDeletedAt(OffsetDateTime.now());
            document.setDeletedBy(actorId);
        }
        if (targetStatus == DocumentStatus.ARCHIVED) {
            document.setClassification(request.getClassification());
        }
        if (targetStatus == DocumentStatus.ARCHIVED) {
            document.setArchivedAt(OffsetDateTime.now());
        }
        Document saved = documentRepository.save(document);

        AuditAction auditAction = mapToAuditAction(targetStatus);
        auditService.log(actorId, auditAction, ResourceType.DOCUMENT, documentId,
                "Status changed " + currentStatus + " -> " + targetStatus +
                        (comment != null ? " (" + comment + ")" : ""));

        return responseMapper.toDocumentResponse(saved);
    }

    private AuditAction mapToAuditAction(DocumentStatus targetStatus) {
        return switch (targetStatus) {
            case SUBMITTED -> AuditAction.SUBMIT;
            case UNDER_REVIEW -> AuditAction.START_REVIEW;
            case APPROVED -> AuditAction.APPROVE;
            case REJECTED -> AuditAction.REJECT;
            case ARCHIVED -> AuditAction.ARCHIVE;
            default -> AuditAction.UPDATE;
        };
    }
}
