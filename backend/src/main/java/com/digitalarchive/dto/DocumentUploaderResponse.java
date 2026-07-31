package com.digitalarchive.dto;

public record DocumentUploaderResponse(
        String username,
        String fullName,
        String email,
        DepartmentSummaryResponse department) {
}
