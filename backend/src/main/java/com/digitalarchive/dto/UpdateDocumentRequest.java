package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ClassificationLevel;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateDocumentRequest {
    private String title;
    private String description;
    private UUID categoryId;
    private ClassificationLevel classification;
}