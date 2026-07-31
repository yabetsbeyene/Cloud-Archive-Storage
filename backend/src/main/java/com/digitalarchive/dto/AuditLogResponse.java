package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID auditLogId,
        UUID actorId,
        AuditActorResponse actor,
        AuditAction action,
        ResourceType resourceType,
        UUID resourceId,
        AuditResourceResponse resource,
        String performedAction,
        String details,
        String ipAddress,
        OffsetDateTime createdAt) {
}
