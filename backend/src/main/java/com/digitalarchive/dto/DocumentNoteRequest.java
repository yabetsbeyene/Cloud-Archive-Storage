package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.NoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DocumentNoteRequest(
        NoteType noteType,
        @NotBlank @Size(max = 10000) String note) {
}
