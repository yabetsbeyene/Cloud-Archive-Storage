package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.NoteType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DocumentNoteResponse(
        UUID noteId,
        UUID documentId,
        NoteType noteType,
        String note,
        OffsetDateTime createdAt,
        UUID createdBy,
        OffsetDateTime updatedAt,
        UUID updatedBy) {
}
