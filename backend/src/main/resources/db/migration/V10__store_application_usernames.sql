ALTER TABLE users
ADD COLUMN username VARCHAR(150);

UPDATE users
SET username = COALESCE(NULLIF(split_part(email, '@', 1), ''), user_sub::text)
WHERE username IS NULL;

ALTER TABLE users
ALTER COLUMN username SET NOT NULL;
