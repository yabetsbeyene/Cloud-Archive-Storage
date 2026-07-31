package com.digitalarchive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record DepartmentRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        UUID parentDepartmentId) {
}
