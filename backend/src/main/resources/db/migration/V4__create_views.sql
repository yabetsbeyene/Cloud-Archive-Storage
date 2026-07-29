-- ============================================================================
-- 1. DOCUMENT DETAILS
-- ============================================================================

CREATE VIEW vw_document_details AS

SELECT

    d.document_id,

    d.reference_number,

    d.title,

    d.description,

    d.classification,

    d.status,

    d.created_at,

    d.updated_at,

    d.archived_at,

    c.category_id,

    c.name AS category_name,

    dep.department_id,

    dep.name AS department_name,

    u.user_sub,

    u.full_name AS created_by_name,

    dv.version_number,

    dv.original_file_name,

    dv.mime_type,

    dv.file_size

FROM documents d

LEFT JOIN categories c
ON d.category_id = c.category_id

LEFT JOIN departments dep
ON d.department_id = dep.department_id

LEFT JOIN users u
ON d.created_by = u.user_sub

LEFT JOIN document_versions dv
ON d.current_version_id = dv.version_id;



-- ============================================================================
-- 2. DOCUMENT STATISTICS
-- ============================================================================

CREATE VIEW vw_document_statistics AS

SELECT

    status,

    COUNT(*) AS total_documents

FROM documents

GROUP BY status;




-- ============================================================================
-- 3. RECENT DOCUMENTS
-- ============================================================================

CREATE VIEW vw_recent_documents AS

SELECT

    document_id,

    reference_number,

    title,

    status,

    created_at,

    created_by

FROM documents

ORDER BY created_at DESC;




-- ============================================================================
-- 4. AUDIT HISTORY
-- ============================================================================

CREATE VIEW vw_audit_history AS

SELECT

    a.audit_log_id,

    a.action,

    a.resource_type,

    a.resource_id,

    u.full_name,

    a.ip_address,

    a.created_at

FROM audit_logs a

LEFT JOIN users u

ON a.actor_id = u.user_sub;



-- ============================================================================
-- 5. WORKFLOW TIMELINE
-- ============================================================================

CREATE VIEW vw_workflow_timeline AS

SELECT

    w.workflow_id,

    w.document_id,

    w.from_status,

    w.to_status,

    w.comment,

    w.changed_at,

    u.full_name

FROM document_workflow_history w

LEFT JOIN users u

ON w.changed_by = u.user_sub;
