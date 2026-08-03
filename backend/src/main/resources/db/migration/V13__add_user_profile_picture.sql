ALTER TABLE users
ADD COLUMN profile_picture_file_name VARCHAR(500),
ADD COLUMN profile_picture_mime_type VARCHAR(100),
ADD COLUMN profile_picture_updated_at TIMESTAMP WITH TIME ZONE;
