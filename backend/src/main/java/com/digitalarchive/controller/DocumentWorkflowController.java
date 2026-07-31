package com.digitalarchive.controller;

import com.digitalarchive.domain.enums.DocumentStatus;
import com.digitalarchive.dto.DocumentResponse;
import com.digitalarchive.dto.TransitionRequest;
import com.digitalarchive.dto.WorkflowHistoryResponse;
import com.digitalarchive.service.DocumentWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents/{documentId}/workflow")
public class DocumentWorkflowController {

        private final DocumentWorkflowService workflowService;

        @GetMapping("/history")
        public List<WorkflowHistoryResponse> history(@PathVariable UUID documentId) {
                return workflowService.history(documentId);
        }

        @PostMapping("/submit")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
        public DocumentResponse submit(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.SUBMITTED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/start-review")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'MANAGER')")
        public DocumentResponse startReview(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.UNDER_REVIEW,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/approve")
        @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
        public DocumentResponse approve(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.APPROVED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/reject")
        @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
        public DocumentResponse reject(@PathVariable UUID documentId, @Valid @RequestBody TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.REJECTED,
                                request.getComment(), UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/archive")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST')")
        public DocumentResponse archive(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.ARCHIVED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }
}
