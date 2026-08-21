package com.digitalarchive.domain.enums;

/**
 * Mirrors the Postgres enum type `document_status` created in
 * V1__init_schema.sql.
 * Valid transitions are enforced in the service layer, not here — see
 * slide 11 (state machine) for the allowed graph:
 * DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> ARCHIVED
 * -> REJECTED -> DRAFT
 */
public enum DocumentStatus {
    DRAFT,
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    ARCHIVED
}
