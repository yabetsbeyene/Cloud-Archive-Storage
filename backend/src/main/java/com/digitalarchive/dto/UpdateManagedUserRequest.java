package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ApplicationRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateManagedUserRequest(
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotNull ApplicationRole role,
        UUID departmentId,
        @NotNull Boolean isActive) {
}
