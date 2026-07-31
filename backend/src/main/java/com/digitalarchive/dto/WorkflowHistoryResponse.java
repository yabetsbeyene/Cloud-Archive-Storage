package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.DocumentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkflowHistoryResponse(
        UUID workflowId,
        UUID documentId,
        DocumentStatus fromStatus,
        DocumentStatus toStatus,
        String comment,
        OffsetDateTime changedAt,
        UUID changedBy) {
}
