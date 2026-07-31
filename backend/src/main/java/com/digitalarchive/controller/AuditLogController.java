package com.digitalarchive.controller;

import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.dto.AuditLogResponse;
import com.digitalarchive.dto.PageResponse;
import com.digitalarchive.service.AuditLogQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogQueryService auditLogQueryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST')")
    public PageResponse<AuditLogResponse> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) ResourceType resourceType,
            @RequestParam(required = false) UUID resourceId) {
        return auditLogQueryService.find(page, size, actorId, resourceType, resourceId);
    }
}
