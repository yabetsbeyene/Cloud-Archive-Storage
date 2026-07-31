package com.digitalarchive.service;

import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.enums.DocumentStatus;
import com.digitalarchive.dto.DashboardResponse;
import com.digitalarchive.mapper.ApiResponseMapper;
import com.digitalarchive.repository.AppUserRepository;
import com.digitalarchive.repository.CategoryRepository;
import com.digitalarchive.repository.DepartmentRepository;
import com.digitalarchive.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final List<DocumentStatus> REVIEW_STATUSES = List.of(
            DocumentStatus.SUBMITTED,
            DocumentStatus.UNDER_REVIEW,
            DocumentStatus.APPROVED);

    private final DocumentRepository documentRepository;
    private final AppUserRepository appUserRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;
    private final ApiResponseMapper responseMapper;

    public DashboardResponse getDashboard(UUID actorId, List<String> roles) {
        String view = primaryView(roles);
        List<Document> documents = switch (view) {
            case "ADMIN", "ARCHIVIST" ->
                    documentRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
            case "MANAGER" ->
                    documentRepository.findByStatusInAndDeletedAtIsNullOrderByCreatedAtDesc(REVIEW_STATUSES);
            case "DEPT_USER" ->
                    documentRepository.findByCreatedByAndDeletedAtIsNullOrderByCreatedAtDesc(actorId);
            default ->
                    documentRepository.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                            DocumentStatus.ARCHIVED);
        };

        Map<DocumentStatus, Long> byStatus = new EnumMap<>(DocumentStatus.class);
        for (DocumentStatus status : DocumentStatus.values()) {
            byStatus.put(status, 0L);
        }
        documents.forEach(document ->
                byStatus.compute(document.getStatus(), (status, count) -> count == null ? 1L : count + 1));

        boolean collectionTotals = view.equals("ADMIN") || view.equals("ARCHIVIST");
        boolean administrationTotals = view.equals("ADMIN");
        var recentDocuments = documents.stream()
                .limit(5)
                .map(responseMapper::toDocumentResponse)
                .toList();

        return new DashboardResponse(
                view,
                collectionTotals,
                administrationTotals,
                documents.size(),
                administrationTotals ? appUserRepository.countByDeletedAtIsNull() : 0,
                collectionTotals ? categoryRepository.countByDeletedAtIsNull() : 0,
                collectionTotals ? departmentRepository.countByDeletedAtIsNull() : 0,
                byStatus,
                recentDocuments);
    }

    private String primaryView(List<String> roles) {
        if (roles.contains("ADMIN")) return "ADMIN";
        if (roles.contains("ARCHIVIST")) return "ARCHIVIST";
        if (roles.contains("MANAGER")) return "MANAGER";
        if (roles.contains("DEPT_USER")) return "DEPT_USER";
        return "VIEWER";
    }
}
