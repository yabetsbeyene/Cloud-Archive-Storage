package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    List<DocumentVersion> findByDocument_DocumentIdOrderByVersionNumberDesc(UUID documentId);

    Optional<DocumentVersion> findByVersionIdAndDocument_DocumentId(UUID versionId, UUID documentId);
}
