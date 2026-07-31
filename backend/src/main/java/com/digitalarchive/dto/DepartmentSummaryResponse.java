package com.digitalarchive.dto;

import java.util.UUID;

public record DepartmentSummaryResponse(
        UUID departmentId,
        String name) {
}
