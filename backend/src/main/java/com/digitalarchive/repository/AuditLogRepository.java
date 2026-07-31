package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.AuditLog;
import com.digitalarchive.domain.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByActorIdOrderByCreatedAtDesc(UUID actorId, Pageable pageable);

    Page<AuditLog> findByResourceTypeOrderByCreatedAtDesc(
            ResourceType resourceType,
            Pageable pageable);

    Page<AuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(
            ResourceType resourceType,
            UUID resourceId,
            Pageable pageable);
}
