package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ClassificationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateDocumentRequest {
    @NotBlank
    @Size(max = 300)
    private String title;

    @Size(max = 10000)
    private String description;

    @NotNull
    private UUID categoryId;

    @NotNull
    private UUID departmentId;

    private ClassificationLevel classification;
}
