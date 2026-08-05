DELETE FROM audit_logs
WHERE NOT (
    (
        resource_type = 'DOCUMENT_VERSION'
        AND action IN ('UPLOAD', 'DOWNLOAD', 'VIEW')
    )
    OR (
        resource_type = 'DOCUMENT'
        AND (
            action IN ('APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE', 'SUBMIT', 'START_REVIEW')
            OR (action = 'CREATE' AND details LIKE 'Created document:%')
            OR (action = 'DELETE' AND details LIKE 'Soft-deleted document:%')
            OR (action = 'UPDATE' AND details LIKE 'Status changed %')
        )
    )
    OR (
        resource_type = 'USER'
        AND action IN ('CREATE', 'DELETE')
    )
);
