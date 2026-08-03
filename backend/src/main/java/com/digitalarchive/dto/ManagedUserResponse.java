package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ApplicationRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ManagedUserResponse(
        UUID userSub,
        String username,
        String fullName,
        String email,
        ApplicationRole role,
        DepartmentSummaryResponse department,
        boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime profilePictureUpdatedAt) {
}
