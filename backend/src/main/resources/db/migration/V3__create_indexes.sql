-- ============================================================================
-- V3__create_indexes.sql
-- Organizational Digital Archive & Records Management System
--
-- Creates indexes to improve query performance.
--
-- Author: Guyo Boru
-- Version: 1.0
-- ============================================================================


-- ============================================================================
-- 1. USERS
-- ============================================================================

CREATE INDEX idx_users_department
ON users(department_id);



-- ============================================================================
-- 2. DOCUMENTS
-- ============================================================================

CREATE INDEX idx_documents_reference_number
ON documents(reference_number);

CREATE INDEX idx_documents_status
ON documents(status);

CREATE INDEX idx_documents_department
ON documents(department_id);

CREATE INDEX idx_documents_category
ON documents(category_id);

CREATE INDEX idx_documents_created_at
ON documents(created_at DESC);

CREATE INDEX idx_documents_archived_at
ON documents(archived_at);

CREATE INDEX idx_documents_created_by
ON documents(created_by);



-- ============================================================================
-- 3. DOCUMENT VERSIONS
-- ============================================================================

CREATE INDEX idx_versions_document
ON document_versions(document_id);

CREATE INDEX idx_versions_created_at
ON document_versions(uploaded_at DESC);

CREATE INDEX idx_versions_uploaded_by
ON document_versions(uploaded_by);



-- ============================================================================
-- 4. DOCUMENT NOTES
-- ============================================================================

CREATE INDEX idx_notes_document
ON document_notes(document_id);

CREATE INDEX idx_notes_created_by
ON document_notes(created_by);

CREATE INDEX idx_notes_created_at
ON document_notes(created_at DESC);



-- ============================================================================
-- 5. WORKFLOW HISTORY
-- ============================================================================

CREATE INDEX idx_workflow_document
ON document_workflow_history(document_id);

CREATE INDEX idx_workflow_changed_by
ON document_workflow_history(changed_by);

CREATE INDEX idx_workflow_created_at
ON document_workflow_history(changed_at DESC);



-- ============================================================================
-- 6. AUDIT LOGS
-- ============================================================================

CREATE INDEX idx_audit_actor
ON audit_logs(actor_id);

CREATE INDEX idx_audit_resource
ON audit_logs(resource_type, resource_id);

CREATE INDEX idx_audit_created_at
ON audit_logs(created_at DESC);



-- ============================================================================
-- 7. FULL-TEXT SEARCH
-- ============================================================================

CREATE INDEX idx_documents_title_search
ON documents
USING GIN
(
    to_tsvector('english', title)
);

CREATE INDEX idx_documents_description_search
ON documents
USING GIN
(
    to_tsvector('english', COALESCE(description, ''))
);