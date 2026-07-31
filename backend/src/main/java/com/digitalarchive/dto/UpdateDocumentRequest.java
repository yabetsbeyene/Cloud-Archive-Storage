package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ClassificationLevel;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateDocumentRequest {
    @Size(min = 1, max = 300)
    private String title;

    @Size(max = 10000)
    private String description;
    private UUID categoryId;
    private ClassificationLevel classification;
}
