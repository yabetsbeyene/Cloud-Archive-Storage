-- Hibernate writes the optional address as text. Keeping this field as INET
-- caused even NULL audit inserts to be bound as bytea and rolled back the
-- business transaction that produced the audit event.
DROP VIEW vw_audit_history;

ALTER TABLE audit_logs
    ALTER COLUMN ip_address TYPE VARCHAR(45)
    USING ip_address::TEXT;

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
LEFT JOIN users u ON a.actor_id = u.user_sub;
