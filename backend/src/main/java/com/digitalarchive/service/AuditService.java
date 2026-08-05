package com.digitalarchive.service;

import com.digitalarchive.domain.entity.AuditLog;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Central place that writes to audit_logs. Every other service calls this
 * instead of touching AuditLogRepository directly, so logging stays consistent.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Map<ResourceType, Set<AuditAction>> TRACKED_ACTIONS =
            trackedActions();

    private final AuditLogRepository auditLogRepository;

    public void log(UUID actorId, AuditAction action, ResourceType resourceType, UUID resourceId, String details) {
        if (!TRACKED_ACTIONS.getOrDefault(resourceType, Set.of()).contains(action)) {
            return;
        }
        AuditLog entry = AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .details(details)
                .build();
        auditLogRepository.save(entry);
    }

    private static Map<ResourceType, Set<AuditAction>> trackedActions() {
        Map<ResourceType, Set<AuditAction>> actions = new EnumMap<>(ResourceType.class);
        actions.put(ResourceType.DOCUMENT, EnumSet.of(
                AuditAction.CREATE,
                AuditAction.DELETE,
                AuditAction.SUBMIT,
                AuditAction.START_REVIEW,
                AuditAction.APPROVE,
                AuditAction.REJECT,
                AuditAction.ARCHIVE,
                AuditAction.RESTORE));
        actions.put(ResourceType.DOCUMENT_VERSION, EnumSet.of(
                AuditAction.UPLOAD,
                AuditAction.DOWNLOAD,
                AuditAction.VIEW));
        actions.put(ResourceType.USER, EnumSet.of(
                AuditAction.CREATE,
                AuditAction.DELETE));
        return Map.copyOf(actions);
    }
}
