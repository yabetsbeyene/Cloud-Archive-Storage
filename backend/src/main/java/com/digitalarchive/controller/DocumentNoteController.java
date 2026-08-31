package com.digitalarchive.controller;

import com.digitalarchive.dto.DocumentNoteRequest;
import com.digitalarchive.dto.DocumentNoteResponse;
import com.digitalarchive.service.DocumentNoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents/{documentId}/notes")
public class DocumentNoteController {

    private final DocumentNoteService noteService;

    @GetMapping
    public List<DocumentNoteResponse> list(@PathVariable UUID documentId,
            @AuthenticationPrincipal Jwt jwt) {
        return noteService.list(documentId, jwt);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER')")
    public ResponseEntity<DocumentNoteResponse> create(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentNoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        DocumentNoteResponse created = noteService.create(documentId, request, actorId(jwt), jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER')")
    public ResponseEntity<DocumentNoteResponse> update(
            @PathVariable UUID documentId,
            @PathVariable UUID noteId,
            @Valid @RequestBody DocumentNoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return noteService.update(documentId, noteId, request, actorId(jwt), hasRealmRole(jwt, "ADMIN"), jwt)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{noteId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID documentId,
            @PathVariable UUID noteId,
            @AuthenticationPrincipal Jwt jwt) {
        return noteService.softDelete(documentId, noteId, actorId(jwt), hasRealmRole(jwt, "ADMIN"), jwt)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    private UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @SuppressWarnings("unchecked")
    private boolean hasRealmRole(Jwt jwt, String role) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        return realmAccess != null
                && realmAccess.get("roles") instanceof List<?> roles
                && roles.stream().anyMatch(candidate -> role.equalsIgnoreCase(String.valueOf(candidate)));
    }
}
