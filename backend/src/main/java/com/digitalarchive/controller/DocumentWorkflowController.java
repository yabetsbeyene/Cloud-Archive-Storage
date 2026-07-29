package com.digitalarchive.controller;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.enums.DocumentStatus;
import com.digitalarchive.dto.TransitionRequest;
import com.digitalarchive.service.DocumentWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents/{documentId}/workflow")
public class DocumentWorkflowController {

        private final DocumentWorkflowService workflowService;

        @PostMapping("/submit")
        public Document submit(@PathVariable UUID documentId, @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.SUBMITTED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/start-review")
        public Document startReview(@PathVariable UUID documentId,
                        @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.UNDER_REVIEW,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/approve")
        public Document approve(@PathVariable UUID documentId, @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.APPROVED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/reject")
        public Document reject(@PathVariable UUID documentId, @RequestBody TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.REJECTED,
                                request.getComment(), UUID.fromString(jwt.getSubject()));
        }

        @PostMapping("/archive")
        public Document archive(@PathVariable UUID documentId, @RequestBody(required = false) TransitionRequest request,
                        @AuthenticationPrincipal Jwt jwt) {
                return workflowService.transition(documentId, DocumentStatus.ARCHIVED,
                                request != null ? request.getComment() : null, UUID.fromString(jwt.getSubject()));
        }
}