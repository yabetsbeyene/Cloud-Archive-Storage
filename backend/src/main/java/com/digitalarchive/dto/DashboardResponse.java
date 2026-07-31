package com.digitalarchive.dto;

import com.digitalarchive.domain.enums.DocumentStatus;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        String view,
        boolean showCollectionTotals,
        boolean showAdministrationTotals,
        long totalDocuments,
        long totalUsers,
        long totalCategories,
        long totalDepartments,
        Map<DocumentStatus, Long> documentsByStatus,
        List<DocumentResponse> recentDocuments) {
}
