package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Optional<Document> findByReferenceNumber(String referenceNumber);

    List<Document> findByStatusAndDeletedAtIsNull(DocumentStatus status);

    @Query(value = """
            SELECT * FROM documents d
            WHERE d.deleted_at IS NULL
              AND to_tsvector('english', d.title || ' ' || coalesce(d.description, ''))
                  @@ plainto_tsquery('english', :searchTerm)
            """, nativeQuery = true)
    List<Document> searchByTitleOrDescription(@Param("searchTerm") String searchTerm);
}