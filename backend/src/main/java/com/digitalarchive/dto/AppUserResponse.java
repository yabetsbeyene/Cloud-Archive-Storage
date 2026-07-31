package com.digitalarchive.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AppUserResponse(
        UUID userSub,
        String username,
        String fullName,
        String email,
        DepartmentSummaryResponse department,
        boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
}
