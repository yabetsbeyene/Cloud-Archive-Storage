package com.digitalarchive.domain.enums;

/**
 * Mirrors Postgres enum `audit_action`. Per slide 15, every significant
 * action is logged: create, update, delete, view, upload, download,
 * login, logout, approve, reject, archive, restore.
 */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    VIEW,
    UPLOAD,
    DOWNLOAD,
    LOGIN,
    LOGOUT,
    APPROVE,
    REJECT,
    ARCHIVE,
    RESTORE
}
