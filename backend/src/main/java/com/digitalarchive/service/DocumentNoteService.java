package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentNote;
import com.digitalarchive.domain.enums.NoteType;
import com.digitalarchive.dto.DocumentNoteRequest;
import com.digitalarchive.dto.DocumentNoteResponse;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.DocumentNoteRepository;
import com.digitalarchive.repository.DocumentRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentNoteService {

    private final DocumentNoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final ApiResponseMapper responseMapper;
    private final EntityManager entityManager;
    private final DocumentAccessService documentAccessService;

    public List<DocumentNoteResponse> list(UUID documentId, Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        documentAccessService.requireRead(document, documentAccessService.context(jwt));
        return noteRepository.findByDocument_DocumentIdAndDeletedAtIsNullOrderByCreatedAtDesc(documentId).stream()
                .map(responseMapper::toNoteResponse)
                .toList();
    }

    @Transactional
    public DocumentNoteResponse create(UUID documentId, DocumentNoteRequest request, UUID actorId, Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        documentAccessService.requireRead(document, documentAccessService.context(jwt));
        DocumentNote note = DocumentNote.builder()
                .document(document)
                .noteType(request.noteType() == null ? NoteType.GENERAL : request.noteType())
                .note(request.note().trim())
                .createdBy(actorId)
                .build();

        DocumentNote saved = noteRepository.saveAndFlush(note);
        entityManager.refresh(saved);
        return responseMapper.toNoteResponse(saved);
    }

    @Transactional
    public Optional<DocumentNoteResponse> update(
            UUID documentId,
            UUID noteId,
            DocumentNoteRequest request,
            UUID actorId,
            boolean administrator,
            Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        documentAccessService.requireRead(document, documentAccessService.context(jwt));
        return findActiveNote(documentId, noteId).map(existing -> {
            requireOwnerOrAdministrator(existing, actorId, administrator);
            if (request.noteType() != null) {
                existing.setNoteType(request.noteType());
            }
            existing.setNote(request.note().trim());
            existing.setUpdatedBy(actorId);

            DocumentNote saved = noteRepository.save(existing);
            return responseMapper.toNoteResponse(saved);
        });
    }

    @Transactional
    public boolean softDelete(UUID documentId, UUID noteId, UUID actorId, boolean administrator, Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        documentAccessService.requireRead(document, documentAccessService.context(jwt));
        return findActiveNote(documentId, noteId).map(existing -> {
            requireOwnerOrAdministrator(existing, actorId, administrator);
            existing.setDeletedAt(OffsetDateTime.now());
            existing.setDeletedBy(actorId);
            noteRepository.save(existing);
            return true;
        }).orElse(false);
    }

    private Document requireActiveDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .filter(document -> document.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
    }

    private Optional<DocumentNote> findActiveNote(UUID documentId, UUID noteId) {
        return noteRepository.findByNoteIdAndDocument_DocumentIdAndDeletedAtIsNull(noteId, documentId);
    }

    private void requireOwnerOrAdministrator(DocumentNote note, UUID actorId, boolean administrator) {
        if (!administrator && !actorId.equals(note.getCreatedBy())) {
            throw new AccessDeniedException("Only the note author or an administrator can modify this note");
        }
    }
}
