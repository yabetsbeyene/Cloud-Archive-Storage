package com.digitalarchive.controller;

import com.digitalarchive.dto.DocumentVersionResponse;
import com.digitalarchive.service.DocumentVersionService;
import com.digitalarchive.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.UNSUPPORTED_MEDIA_TYPE;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents/{documentId}/versions")
public class DocumentVersionController {

        private final DocumentVersionService documentVersionService;
        private final FileStorageService fileStorageService;

        @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER', 'VIEWER')")
        public List<DocumentVersionResponse> listVersions(
                        @PathVariable UUID documentId,
                        @AuthenticationPrincipal Jwt jwt) {
                return documentVersionService.listVersions(documentId, jwt);
        }

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
        public ResponseEntity<DocumentVersionResponse> upload(@PathVariable UUID documentId,
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal Jwt jwt) {
                DocumentVersionResponse saved = documentVersionService.upload(documentId, file, jwt);
                return ResponseEntity.ok(saved);
        }

        @GetMapping("/{versionId}/download")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER', 'VIEWER')")
        public ResponseEntity<Resource> download(@PathVariable UUID documentId,
                        @PathVariable UUID versionId,
                        @AuthenticationPrincipal Jwt jwt) {
                DocumentVersionService.DownloadInfo download =
                                documentVersionService.getDownloadInfo(documentId, versionId, jwt);

                try {
                        Resource resource = new UrlResource(
                                        fileStorageService.resolve(download.storedFileName()).toUri());
                        if (!resource.exists()) {
                                return ResponseEntity.notFound().build();
                        }

                        documentVersionService.recordDownload(
                                        download, documentId, UUID.fromString(jwt.getSubject()));

                        String contentDisposition = ContentDisposition.attachment()
                                        .filename(download.originalFileName(), StandardCharsets.UTF_8)
                                        .build()
                                        .toString();
                        String contentType = download.mimeType() != null
                                        ? download.mimeType()
                                        : MediaType.APPLICATION_OCTET_STREAM_VALUE;

                        return ResponseEntity.ok()
                                        .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                                        .body(resource);
                } catch (MalformedURLException e) {
                        throw new RuntimeException(e);
                }
        }

        @GetMapping("/{versionId}/preview")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER', 'VIEWER')")
        public ResponseEntity<Resource> preview(@PathVariable UUID documentId,
                        @PathVariable UUID versionId,
                        @AuthenticationPrincipal Jwt jwt) {
                DocumentVersionService.DownloadInfo preview =
                                documentVersionService.getDownloadInfo(documentId, versionId, jwt);
                if (!documentVersionService.isPreviewable(preview.mimeType())) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                        UNSUPPORTED_MEDIA_TYPE,
                                        "Preview is available for PDF, image, and plain-text files");
                }

                try {
                        Resource resource = new UrlResource(
                                        fileStorageService.resolve(preview.storedFileName()).toUri());
                        if (!resource.exists()) {
                                return ResponseEntity.notFound().build();
                        }

                        documentVersionService.recordPreview(
                                        preview, documentId, UUID.fromString(jwt.getSubject()));

                        String contentDisposition = ContentDisposition.inline()
                                        .filename(preview.originalFileName(), StandardCharsets.UTF_8)
                                        .build()
                                        .toString();

                        return ResponseEntity.ok()
                                        .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                                        .header(HttpHeaders.CONTENT_TYPE, preview.mimeType())
                                        .header("X-Content-Type-Options", "nosniff")
                                        .body(resource);
                } catch (MalformedURLException e) {
                        throw new RuntimeException(e);
                }
        }
}
