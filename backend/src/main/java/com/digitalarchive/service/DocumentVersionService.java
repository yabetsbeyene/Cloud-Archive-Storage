package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentVersion;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.dto.DocumentVersionResponse;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.DocumentRepository;
import com.digitalarchive.repository.DocumentVersionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentVersionService {

    private static final Set<String> PREVIEWABLE_MIME_TYPES = Set.of(
            "application/pdf",
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/csv",
            "text/plain");

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final ApiResponseMapper responseMapper;
    private final EntityManager entityManager;
    private final DocumentAccessService documentAccessService;

    public List<DocumentVersionResponse> listVersions(UUID documentId, Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        documentAccessService.requireRead(document, documentAccessService.context(jwt));
        return versionRepository.findByDocument_DocumentIdOrderByVersionNumberDesc(documentId).stream()
                .map(responseMapper::toVersionResponse)
                .toList();
    }

    /**
     * Saves the version, updates the document's current version, and writes the
     * audit entry in one database transaction.
     */
    @Transactional
    public DocumentVersionResponse upload(UUID documentId, MultipartFile file, Jwt jwt) {
        Document document = requireActiveDocument(documentId);
        DocumentAccessService.AccessContext access = documentAccessService.context(jwt);
        documentAccessService.requireWrite(document, access);
        UUID actorId = access.userId();

        FileStorageService.StoredFile stored = fileStorageService.store(file);

        int nextVersionNumber = versionRepository
                .findByDocument_DocumentIdOrderByVersionNumberDesc(documentId)
                .stream()
                .findFirst()
                .map(version -> version.getVersionNumber() + 1)
                .orElse(1);

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

        DocumentVersion saved = versionRepository.saveAndFlush(version);

        document.setCurrentVersion(saved);
        document.setUpdatedBy(actorId);
        documentRepository.save(document);

        auditService.log(actorId, AuditAction.UPLOAD, ResourceType.DOCUMENT_VERSION,
                saved.getVersionId(),
                "Uploaded version " + nextVersionNumber + " for document " + documentId);

        entityManager.refresh(saved);
        return responseMapper.toVersionResponse(saved);
    }

    public DownloadInfo getDownloadInfo(UUID documentId, UUID versionId, Jwt jwt) {
        DocumentVersion version = versionRepository.findByVersionIdAndDocument_DocumentId(versionId, documentId)
                .filter(candidate -> candidate.getDocument().getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Document version not found"));
        documentAccessService.requireRead(version.getDocument(), documentAccessService.context(jwt));
        return new DownloadInfo(
                version.getVersionId(),
                version.getVersionNumber(),
                version.getOriginalFileName(),
                version.getStoredFileName(),
                version.getMimeType());
    }

    @Transactional
    public void recordDownload(DownloadInfo download, UUID documentId, UUID actorId) {
        auditService.log(actorId, AuditAction.DOWNLOAD, ResourceType.DOCUMENT_VERSION,
                download.versionId(),
                "Downloaded version " + download.versionNumber() + " of document " + documentId);
    }

    public boolean isPreviewable(String mimeType) {
        return mimeType != null
                && PREVIEWABLE_MIME_TYPES.contains(
                        mimeType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT));
    }

    @Transactional
    public void recordPreview(DownloadInfo preview, UUID documentId, UUID actorId) {
        auditService.log(actorId, AuditAction.VIEW, ResourceType.DOCUMENT_VERSION,
                preview.versionId(),
                "Opened version " + preview.versionNumber() + " of document " + documentId);
    }

    private Document requireActiveDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .filter(document -> document.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
    }

    public record DownloadInfo(
            UUID versionId,
            Integer versionNumber,
            String originalFileName,
            String storedFileName,
            String mimeType) {
    }
}
