package com.digitalarchive.service;

import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentVersion;
import com.digitalarchive.dto.AuditActorResponse;
import com.digitalarchive.dto.AuditLogResponse;
import com.digitalarchive.dto.AuditResourceResponse;
import com.digitalarchive.dto.DepartmentSummaryResponse;
import com.digitalarchive.dto.PageResponse;
import com.digitalarchive.repository.AppUserRepository;
import com.digitalarchive.repository.AuditLogRepository;
import com.digitalarchive.repository.CategoryRepository;
import com.digitalarchive.repository.DepartmentRepository;
import com.digitalarchive.repository.DocumentRepository;
import com.digitalarchive.repository.DocumentVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogQueryService {

    private final AuditLogRepository auditLogRepository;
    private final AppUserRepository appUserRepository;
    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;

    public PageResponse<AuditLogResponse> find(
            Integer requestedPage,
            Integer requestedSize,
            UUID actorId,
            ResourceType resourceType,
            UUID resourceId) {
        int page = Math.max(requestedPage == null ? 0 : requestedPage, 0);
        int size = Math.min(Math.max(requestedSize == null ? 25 : requestedSize, 1), 100);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (resourceId != null && resourceType == null) {
            throw new IllegalArgumentException("resourceType must be supplied when filtering by resourceId");
        }

        var result = actorId != null
                ? auditLogRepository.findByActorIdOrderByCreatedAtDesc(actorId, pageable)
                : resourceId != null
                        ? auditLogRepository.findByResourceTypeAndResourceIdOrderByCreatedAtDesc(
                                resourceType, resourceId, pageable)
                        : resourceType != null
                                ? auditLogRepository.findByResourceTypeOrderByCreatedAtDesc(
                                        resourceType, pageable)
                        : auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);

        return PageResponse.from(result.map(log -> new AuditLogResponse(
                log.getAuditLogId(),
                log.getActorId(),
                actor(log.getActorId()),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                resource(log.getResourceType(), log.getResourceId()),
                performedAction(log.getAction().name(), log.getResourceType()),
                log.getDetails(),
                log.getIpAddress(),
                log.getCreatedAt())));
    }

    private AuditActorResponse actor(UUID actorId) {
        if (actorId == null) {
            return null;
        }
        return appUserRepository.findById(actorId)
                .map(user -> {
                    var department = user.getDepartment();
                    return new AuditActorResponse(
                            user.getFullName(),
                            user.getEmail(),
                            department == null
                                    ? null
                                    : new DepartmentSummaryResponse(
                                            department.getDepartmentId(),
                                            department.getName()));
                })
                .orElse(null);
    }

    private AuditResourceResponse resource(ResourceType type, UUID resourceId) {
        if (resourceId == null) {
            return new AuditResourceResponse("System", null, null);
        }
        return switch (type) {
            case DOCUMENT -> documentRepository.findById(resourceId)
                    .map(this::documentResource)
                    .orElseGet(this::unavailableResource);
            case DOCUMENT_VERSION -> documentVersionRepository.findById(resourceId)
                    .map(this::versionResource)
                    .orElseGet(this::unavailableResource);
            case USER -> appUserRepository.findById(resourceId)
                    .map(this::userResource)
                    .orElseGet(this::unavailableResource);
            case CATEGORY -> categoryRepository.findById(resourceId)
                    .map(category -> new AuditResourceResponse(
                            category.getName(),
                            category.getName(),
                            null))
                    .orElseGet(this::unavailableResource);
            case DEPARTMENT -> departmentRepository.findById(resourceId)
                    .map(department -> new AuditResourceResponse(
                            department.getName(),
                            null,
                            department.getName()))
                    .orElseGet(this::unavailableResource);
        };
    }

    private AuditResourceResponse documentResource(Document document) {
        return new AuditResourceResponse(
                document.getTitle(),
                document.getCategory().getName(),
                document.getDepartment().getName());
    }

    private AuditResourceResponse versionResource(DocumentVersion version) {
        Document document = version.getDocument();
        return new AuditResourceResponse(
                document.getTitle() + " · version " + version.getVersionNumber(),
                document.getCategory().getName(),
                document.getDepartment().getName());
    }

    private AuditResourceResponse userResource(AppUser user) {
        return new AuditResourceResponse(
                user.getFullName(),
                null,
                user.getDepartment() == null ? null : user.getDepartment().getName());
    }

    private AuditResourceResponse unavailableResource() {
        return new AuditResourceResponse("Unavailable resource", null, null);
    }

    private String performedAction(String action, ResourceType resourceType) {
        String verb = switch (action) {
            case "CREATE" -> "Created";
            case "UPDATE" -> "Updated";
            case "DELETE" -> "Deleted";
            case "VIEW" -> "Viewed";
            case "UPLOAD" -> "Uploaded";
            case "DOWNLOAD" -> "Downloaded";
            case "SUBMIT" -> "Submitted";
            case "START_REVIEW" -> "Started review of";
            case "LOGIN" -> "Logged in to";
            case "LOGOUT" -> "Logged out of";
            case "APPROVE" -> "Approved";
            case "REJECT" -> "Rejected";
            case "ARCHIVE" -> "Archived";
            case "RESTORE" -> "Restored";
            default -> "Performed action on";
        };
        String resourceName = resourceType.name().toLowerCase().replace('_', ' ');
        return verb + " " + resourceName;
    }
}
