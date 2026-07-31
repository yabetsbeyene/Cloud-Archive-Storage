package com.digitalarchive.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CategoryRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        UUID parentCategoryId,
        @Min(0) Integer retentionPeriodMonths) {
}
