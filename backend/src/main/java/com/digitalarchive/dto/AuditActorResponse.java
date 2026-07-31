package com.digitalarchive.dto;

public record AuditActorResponse(
        String fullName,
        String email,
        DepartmentSummaryResponse department) {
}
