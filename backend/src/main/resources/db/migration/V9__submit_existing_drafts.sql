-- Drafts created before role-aware workflow routing had no review UI and could
-- remain stranded indefinitely. Put them into the review queue.
UPDATE documents
SET status = 'SUBMITTED'::document_status,
    updated_at = now()
WHERE status = 'DRAFT'::document_status
  AND deleted_at IS NULL;
