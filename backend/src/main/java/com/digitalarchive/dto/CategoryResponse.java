package com.digitalarchive.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CategoryResponse(
        UUID categoryId,
        String name,
        String description,
        CategorySummaryResponse parentCategory,
        Integer retentionPeriodMonths,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
