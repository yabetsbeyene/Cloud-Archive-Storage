package com.digitalarchive.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAccountProfileRequest(
        @NotBlank
        @Size(min = 3, max = 150)
        @Pattern(
                regexp = "^[A-Za-z0-9._-]+$",
                message = "Username may contain letters, numbers, dots, underscores and hyphens")
        String username,
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 255) String email) {
}
