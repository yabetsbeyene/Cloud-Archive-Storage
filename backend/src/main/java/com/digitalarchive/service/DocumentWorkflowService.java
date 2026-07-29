package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentWorkflowHistory;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.DocumentStatus;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.repository.DocumentRepository;
import com.digitalarchive.repository.DocumentWorkflowHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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
    private final AuditService auditService;

    private static final Map<DocumentStatus, Set<DocumentStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(
            DocumentStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(DocumentStatus.DRAFT, EnumSet.of(DocumentStatus.SUBMITTED));
        ALLOWED_TRANSITIONS.put(DocumentStatus.SUBMITTED, EnumSet.of(DocumentStatus.UNDER_REVIEW));
        ALLOWED_TRANSITIONS.put(DocumentStatus.UNDER_REVIEW,
                EnumSet.of(DocumentStatus.APPROVED, DocumentStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(DocumentStatus.REJECTED, EnumSet.of(DocumentStatus.DRAFT));
        ALLOWED_TRANSITIONS.put(DocumentStatus.APPROVED, EnumSet.of(DocumentStatus.ARCHIVED));
        ALLOWED_TRANSITIONS.put(DocumentStatus.ARCHIVED, EnumSet.noneOf(DocumentStatus.class));
    }

    public Document transition(UUID documentId, DocumentStatus targetStatus, String comment, UUID actorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));

        if (document.getDeletedAt() != null) {
            throw new IllegalStateException("Cannot transition a deleted document");
        }

        DocumentStatus currentStatus = document.getStatus();
        Set<DocumentStatus> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!allowedNext.contains(targetStatus)) {
            throw new IllegalStateException(
                    "Cannot transition from " + currentStatus + " to " + targetStatus +
                            ". Allowed: " + allowedNext);
        }

        if (targetStatus == DocumentStatus.REJECTED && (comment == null || comment.isBlank())) {
            throw new IllegalArgumentException("A comment is required when rejecting a document");
        }

        // Record history BEFORE changing status, so from/to reflects the real
        // transition
        DocumentWorkflowHistory history = DocumentWorkflowHistory.builder()
                .document(document)
                .fromStatus(currentStatus)
                .toStatus(targetStatus)
                .comment(comment)
                .changedBy(actorId)
                .build();
        historyRepository.save(history);

        document.setStatus(targetStatus);
        document.setUpdatedBy(actorId);
        if (targetStatus == DocumentStatus.ARCHIVED) {
            document.setArchivedAt(OffsetDateTime.now());
        }
        Document saved = documentRepository.save(document);

        AuditAction auditAction = mapToAuditAction(targetStatus);
        auditService.log(actorId, auditAction, ResourceType.DOCUMENT, documentId,
                "Status changed " + currentStatus + " -> " + targetStatus +
                        (comment != null ? " (" + comment + ")" : ""));

        return saved;
    }

    private AuditAction mapToAuditAction(DocumentStatus targetStatus) {
        return switch (targetStatus) {
            case APPROVED -> AuditAction.APPROVE;
            case REJECTED -> AuditAction.REJECT;
            case ARCHIVED -> AuditAction.ARCHIVE;
            default -> AuditAction.UPDATE;
        };
    }
}