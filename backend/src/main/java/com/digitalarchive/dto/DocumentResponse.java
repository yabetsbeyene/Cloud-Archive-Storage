package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ClassificationLevel;
import com.digitalarchive.domain.enums.DocumentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID documentId,
        String referenceNumber,
        String title,
        String description,
        CategoryResponse category,
        DepartmentResponse department,
        ClassificationLevel classification,
        DocumentStatus status,
        DocumentVersionResponse currentVersion,
        OffsetDateTime archivedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        DocumentUploaderResponse uploadedBy,
        UUID createdBy,
        UUID updatedBy) {
}
