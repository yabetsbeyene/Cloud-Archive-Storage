-- Consolidated document feature additions. These were previously split into
-- the workflow decision fields, the "Other" category, and custom department
-- labels; keeping them together preserves the same final schema on a fresh
-- database while avoiding unnecessary migration versions.

ALTER TABLE document_workflow_history
    ADD COLUMN amendment_sections TEXT,
    ADD COLUMN amendment_comment TEXT,
    ADD COLUMN rejection_reason TEXT;

INSERT INTO categories (category_id, name, description, retention_period_months)
SELECT gen_random_uuid(), 'Other', 'Documents that do not fit the standard categories', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE lower(name) = 'other' AND deleted_at IS NULL
);

ALTER TABLE documents
    ALTER COLUMN department_id DROP NOT NULL;

ALTER TABLE documents
    ADD COLUMN other_department_name VARCHAR(150);

ALTER TABLE documents
    ADD CONSTRAINT chk_document_department_reference
    CHECK (department_id IS NOT NULL
        OR (other_department_name IS NOT NULL AND btrim(other_department_name) <> ''));
