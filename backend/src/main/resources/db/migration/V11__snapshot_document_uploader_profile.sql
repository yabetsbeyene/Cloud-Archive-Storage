ALTER TABLE documents
ADD COLUMN uploader_username VARCHAR(150),
ADD COLUMN uploader_full_name VARCHAR(200),
ADD COLUMN uploader_email VARCHAR(255),
ADD COLUMN uploader_department_id UUID,
ADD COLUMN uploader_department_name VARCHAR(150);

UPDATE documents document
SET uploader_username = app_user.username,
    uploader_full_name = app_user.full_name,
    uploader_email = app_user.email,
    uploader_department_id = app_user.department_id,
    uploader_department_name = department.name
FROM users app_user
LEFT JOIN departments department
    ON department.department_id = app_user.department_id
WHERE app_user.user_sub = document.created_by;

UPDATE documents
SET uploader_username = created_by::text,
    uploader_full_name = 'Unknown user',
    uploader_email = created_by::text || '@unknown.local'
WHERE uploader_username IS NULL;

ALTER TABLE documents
ALTER COLUMN uploader_username SET NOT NULL,
ALTER COLUMN uploader_full_name SET NOT NULL,
ALTER COLUMN uploader_email SET NOT NULL;
