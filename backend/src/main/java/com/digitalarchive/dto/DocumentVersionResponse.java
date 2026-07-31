package com.digitalarchive.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentVersionResponse(
        UUID versionId,
        Integer versionNumber,
        String originalFileName,
        String mimeType,
        Long fileSize,
        String checksumSha256,
        OffsetDateTime uploadedAt,
        UUID uploadedBy) {
}
