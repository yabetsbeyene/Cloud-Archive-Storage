package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ApplicationRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateManagedUserRequest(
        @NotBlank
        @Size(min = 3, max = 100)
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
                message = "must contain only letters, numbers, dots, underscores, or hyphens")
        String username,
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank
        @Size(min = 14, max = 128)
        @Pattern(regexp = ".*[a-z].*", message = "must contain a lowercase letter")
        @Pattern(regexp = ".*[A-Z].*", message = "must contain an uppercase letter")
        @Pattern(regexp = ".*[0-9].*", message = "must contain a number")
        @Pattern(regexp = ".*[^A-Za-z0-9\\s].*", message = "must contain a special character")
        String temporaryPassword,
        @NotNull ApplicationRole role,
        UUID departmentId) {
}
