package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.ClassificationLevel;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateDocumentRequest {
    private String title;
    private String description;
    private UUID categoryId;
    private UUID departmentId;
    private ClassificationLevel classification;
}