package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.DocumentNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentNoteRepository extends JpaRepository<DocumentNote, UUID> {
    List<DocumentNote> findByDocument_DocumentIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID documentId);

    Optional<DocumentNote> findByNoteIdAndDocument_DocumentIdAndDeletedAtIsNull(UUID noteId, UUID documentId);
}
