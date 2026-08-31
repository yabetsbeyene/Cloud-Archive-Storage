-- Compatibility migration for databases that already applied the original
-- workflow and category migrations before the features were consolidated.

ALTER TABLE documents
    ALTER COLUMN department_id DROP NOT NULL;

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS other_department_name VARCHAR(150);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_document_department_reference'
          AND conrelid = 'documents'::regclass
    ) THEN
        ALTER TABLE documents
            ADD CONSTRAINT chk_document_department_reference
            CHECK (department_id IS NOT NULL
                OR (other_department_name IS NOT NULL AND btrim(other_department_name) <> ''));
    END IF;
END $$;
