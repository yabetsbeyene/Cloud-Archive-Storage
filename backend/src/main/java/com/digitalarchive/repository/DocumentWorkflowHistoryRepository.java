package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.DocumentWorkflowHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentWorkflowHistoryRepository extends JpaRepository<DocumentWorkflowHistory, UUID> {
    List<DocumentWorkflowHistory> findByDocument_DocumentIdOrderByChangedAtDesc(UUID documentId);
}