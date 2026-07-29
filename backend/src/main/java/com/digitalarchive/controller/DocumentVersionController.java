package com.digitalarchive.controller;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentVersion;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.repository.DocumentRepository;
import com.digitalarchive.repository.DocumentVersionRepository;
import com.digitalarchive.service.AuditService;
import com.digitalarchive.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents/{documentId}/versions")
public class DocumentVersionController {

        private final DocumentVersionRepository versionRepository;
        private final DocumentRepository documentRepository;
        private final FileStorageService fileStorageService;
        private final AuditService auditService;

        @GetMapping
        public List<DocumentVersion> listVersions(@PathVariable UUID documentId) {
                return versionRepository.findByDocument_DocumentIdOrderByVersionNumberDesc(documentId);
        }

        @PostMapping
        public ResponseEntity<DocumentVersion> upload(@PathVariable UUID documentId,
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal Jwt jwt) {
                Document document = documentRepository.findById(documentId)
                                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

                FileStorageService.StoredFile stored = fileStorageService.store(file);

                int nextVersionNumber = versionRepository
                                .findByDocument_DocumentIdOrderByVersionNumberDesc(documentId)
                                .stream()
                                .findFirst()
                                .map(v -> v.getVersionNumber() + 1)
                                .orElse(1);

                UUID actorId = UUID.fromString(jwt.getSubject());

                DocumentVersion version = DocumentVersion.builder()
                                .document(document)
                                .versionNumber(nextVersionNumber)
                                .originalFileName(file.getOriginalFilename())
                                .storedFileName(stored.storedFileName())
                                .filePath(stored.filePath())
                                .mimeType(file.getContentType())
                                .fileSize(stored.fileSize())
                                .checksumSha256(stored.checksumSha256())
                                .uploadedBy(actorId)
                                .build();

                DocumentVersion saved = versionRepository.save(version);

                document.setCurrentVersion(saved);
                documentRepository.save(document);

                auditService.log(actorId, AuditAction.UPLOAD, ResourceType.DOCUMENT_VERSION,
                                saved.getVersionId(),
                                "Uploaded version " + nextVersionNumber + " for document " + documentId);

                return ResponseEntity.ok(saved);
        }

        @GetMapping("/{versionId}/download")
        public ResponseEntity<Resource> download(@PathVariable UUID documentId,
                        @PathVariable UUID versionId,
                        @AuthenticationPrincipal Jwt jwt) {
                DocumentVersion version = versionRepository.findById(versionId)
                                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

                try {
                        Resource resource = new UrlResource(
                                        fileStorageService.resolve(version.getStoredFileName()).toUri());
                        if (!resource.exists()) {
                                return ResponseEntity.notFound().build();
                        }

                        auditService.log(UUID.fromString(jwt.getSubject()), AuditAction.DOWNLOAD,
                                        ResourceType.DOCUMENT_VERSION,
                                        versionId, "Downloaded version " + version.getVersionNumber() + " of document "
                                                        + documentId);

                        return ResponseEntity.ok()
                                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                                        "attachment; filename=\"" + version.getOriginalFileName()
                                                                        + "\"")
                                        .header(HttpHeaders.CONTENT_TYPE, version.getMimeType())
                                        .body(resource);
                } catch (MalformedURLException e) {
                        throw new RuntimeException(e);
                }
        }
}