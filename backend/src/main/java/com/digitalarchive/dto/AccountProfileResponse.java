package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ApplicationRole;
import com.digitalarchive.domain.enums.ThemePreference;

public record AccountProfileResponse(
        String username,
        String fullName,
        String email,
        ApplicationRole role,
        DepartmentSummaryResponse department,
        ThemePreference themePreference) {
}
