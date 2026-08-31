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
        public List<WorkflowHistoryResponse> history(@PathVariable UUID documentId,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.history(documentId, jwt);
        }

        @PostMapping("/submit")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
        public DocumentResponse submit(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.SUBMITTED, request, UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/start-review")
        @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
        public DocumentResponse startReview(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.UNDER_REVIEW, request, UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/approve")
        @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
        public DocumentResponse approve(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.APPROVED, request, UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/reject")
        @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
        public DocumentResponse reject(@PathVariable UUID documentId, @Valid @RequestBody TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.REJECTED,
                                request, UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/amend")
        @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
        public DocumentResponse amend(@PathVariable UUID documentId, @Valid @RequestBody TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.DRAFT, request,
                                UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/begin-edit")
        @PreAuthorize("hasAnyRole('ADMIN', 'ARCHIVIST', 'DEPT_USER')")
        public DocumentResponse beginEdit(@PathVariable UUID documentId,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.DRAFT, null,
                                UUID.fromString(jwt.getSubject()), jwt);
        }

        @PostMapping("/archive")
        @PreAuthorize("hasRole('ARCHIVIST')")
        public DocumentResponse archive(@PathVariable UUID documentId,
                        @Valid @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.ARCHIVED, request, UUID.fromString(jwt.getSubject()), jwt);
        }
}
