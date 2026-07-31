package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(
            Collection<DocumentStatus> statuses);

    List<Document> findByCreatedByAndDeletedAtIsNullOrderByCreatedAtDesc(UUID createdBy);

    List<Document> findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(DocumentStatus status);

    List<Document> findByDeletedAtIsNullOrderByCreatedAtDesc();

    long countByDeletedAtIsNull();

    @Query(value = """
            SELECT * FROM documents d
            WHERE d.deleted_at IS NULL
              AND to_tsvector('english', d.title || ' ' || coalesce(d.description, ''))
                  @@ plainto_tsquery('english', :searchTerm)
            """, nativeQuery = true)
    List<Document> searchByTitleOrDescription(@Param("searchTerm") String searchTerm);
}
