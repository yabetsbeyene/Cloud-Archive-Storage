package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.DocumentNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentNoteRepository extends JpaRepository<DocumentNote, UUID> {
    List<DocumentNote> findByDocument_DocumentIdOrderByCreatedAtDesc(UUID documentId);
}