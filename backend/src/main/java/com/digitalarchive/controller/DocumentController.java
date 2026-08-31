package com.digitalarchive.controller;

import com.digitalarchive.dto.CreateDocumentRequest;
import com.digitalarchive.dto.DocumentResponse;
import com.digitalarchive.dto.UpdateDocumentRequest;
import com.digitalarchive.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public List<DocumentResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return documentService.listActiveDocuments(jwt);
    }

    @GetMapping("/review-queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER')")
    public List<DocumentResponse> reviewQueue(@AuthenticationPrincipal Jwt jwt) {
        return documentService.listReviewQueue(jwt);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        return documentService.getActiveById(id, jwt)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<DocumentResponse> search(
            @RequestParam("q") String query,
            @AuthenticationPrincipal Jwt jwt) {
        return documentService.searchDocuments(query, jwt);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
    public ResponseEntity<DocumentResponse> create(
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        DocumentResponse created = documentService.createDocument(
                request,
                actorId(jwt),
                hasRealmRole(jwt, "ADMIN"),
                jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
    public ResponseEntity<DocumentResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return documentService.updateDocument(id, request, actorId(jwt), jwt)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        if (!documentService.softDelete(id, actorId(jwt), jwt)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    private UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @SuppressWarnings("unchecked")
    private boolean hasRealmRole(Jwt jwt, String role) {
        Object realmAccessClaim = jwt.getClaim("realm_access");
        if (!(realmAccessClaim instanceof java.util.Map<?, ?> realmAccess)) {
            return false;
        }
        Object rolesClaim = realmAccess.get("roles");
        return rolesClaim instanceof List<?> roles && roles.contains(role);
    }
}
