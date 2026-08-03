package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ApplicationRole;
import com.digitalarchive.domain.enums.ThemePreference;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AccountProfileResponse(
        UUID userSub,
        String username,
        String fullName,
        String email,
        ApplicationRole role,
        DepartmentSummaryResponse department,
        ThemePreference themePreference,
        OffsetDateTime profilePictureUpdatedAt) {
}
