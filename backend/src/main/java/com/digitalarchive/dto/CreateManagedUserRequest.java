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
        @NotBlank @Size(min = 8, max = 128) String temporaryPassword,
        @NotNull ApplicationRole role,
        UUID departmentId,
        Boolean isActive) {
}
