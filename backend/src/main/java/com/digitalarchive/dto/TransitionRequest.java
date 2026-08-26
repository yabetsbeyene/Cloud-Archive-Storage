package com.digitalarchive.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import com.digitalarchive.domain.enums.ClassificationLevel;

import java.util.List;

@Data
public class TransitionRequest {
    @Size(max = 5000)
    private String comment;

    @Size(max = 20)
    private List<@Size(max = 100) String> amendmentSections;

    @Size(max = 5000)
    private String amendmentComment;

    private ClassificationLevel classification;
}
