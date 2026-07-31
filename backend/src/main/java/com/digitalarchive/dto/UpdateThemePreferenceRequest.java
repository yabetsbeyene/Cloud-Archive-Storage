package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ThemePreference;
import jakarta.validation.constraints.NotNull;

public record UpdateThemePreferenceRequest(
        @NotNull ThemePreference themePreference) {
}
