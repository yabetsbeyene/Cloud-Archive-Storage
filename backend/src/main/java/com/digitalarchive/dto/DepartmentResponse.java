package com.digitalarchive.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DepartmentResponse(
        UUID departmentId,
        String name,
        String description,
        DepartmentSummaryResponse parentDepartment,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
