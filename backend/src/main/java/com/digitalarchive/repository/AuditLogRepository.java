package com.digitalarchive.repository;

import com.digitalarchive.domain.entity.AuditLog;
import com.digitalarchive.domain.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByActorIdOrderByCreatedAtDesc(UUID actorId);

    List<AuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(ResourceType resourceType, UUID resourceId);
}