package com.digitalarchive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Size(min = 14, max = 128) String newPassword,
        @NotBlank @Size(max = 128) String confirmPassword) {
}
