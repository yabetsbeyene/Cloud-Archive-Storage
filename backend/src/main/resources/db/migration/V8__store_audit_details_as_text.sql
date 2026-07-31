-- Audit details are intentionally human-readable descriptions, not structured
-- JSON. Convert any existing JSON values to their text representation.
ALTER TABLE audit_logs
    ALTER COLUMN details TYPE TEXT
    USING CASE
        WHEN details IS NULL THEN NULL
        WHEN jsonb_typeof(details) = 'string' THEN details #>> '{}'
        ELSE details::TEXT
    END;
