package com.digitalarchive.mapper;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.domain.entity.Category;
import com.digitalarchive.domain.entity.Department;
import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.entity.DocumentNote;
import com.digitalarchive.domain.entity.DocumentVersion;
import com.digitalarchive.domain.entity.DocumentWorkflowHistory;
import com.digitalarchive.domain.entity.AuditLog;
import com.digitalarchive.dto.AppUserResponse;
import com.digitalarchive.dto.CategoryResponse;
import com.digitalarchive.dto.CategorySummaryResponse;
import com.digitalarchive.dto.DepartmentResponse;
import com.digitalarchive.dto.DepartmentSummaryResponse;
import com.digitalarchive.dto.DocumentResponse;
import com.digitalarchive.dto.DocumentNoteResponse;
import com.digitalarchive.dto.DocumentVersionResponse;
import com.digitalarchive.dto.DocumentUploaderResponse;
import com.digitalarchive.dto.WorkflowHistoryResponse;
import org.springframework.stereotype.Component;

@Component
public class ApiResponseMapper {

    public CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getCategoryId(),
                category.getName(),
                category.getDescription(),
                toCategorySummary(category.getParentCategory()),
                category.getRetentionPeriodMonths(),
                category.getCreatedAt(),
                category.getUpdatedAt());
    }

    public DepartmentResponse toDepartmentResponse(Department department) {
        return new DepartmentResponse(
                department.getDepartmentId(),
                department.getName(),
                department.getDescription(),
                toDepartmentSummary(department.getParentDepartment()),
                department.getCreatedAt(),
                department.getUpdatedAt());
    }

    public AppUserResponse toUserResponse(AppUser user) {
        return new AppUserResponse(
                user.getUserSub(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                toDepartmentSummary(user.getDepartment()),
                Boolean.TRUE.equals(user.getIsActive()),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    public DocumentVersionResponse toVersionResponse(DocumentVersion version) {
        if (version == null) {
            return null;
        }
        return new DocumentVersionResponse(
                version.getVersionId(),
                version.getVersionNumber(),
                version.getOriginalFileName(),
                version.getMimeType(),
                version.getFileSize(),
                version.getChecksumSha256(),
                version.getUploadedAt(),
                version.getUploadedBy());
    }

    public DocumentResponse toDocumentResponse(Document document) {
        return new DocumentResponse(
                document.getDocumentId(),
                document.getReferenceNumber(),
                document.getTitle(),
                document.getDescription(),
                toCategoryResponse(document.getCategory()),
                toDepartmentResponse(document.getDepartment()),
                document.getOtherDepartmentName(),
                document.getClassification(),
                document.getStatus(),
                toVersionResponse(document.getCurrentVersion()),
                document.getArchivedAt(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                toDocumentUploaderResponse(document),
                document.getCreatedBy(),
                document.getUpdatedBy());
    }

    public DocumentNoteResponse toNoteResponse(DocumentNote note) {
        return new DocumentNoteResponse(
                note.getNoteId(),
                note.getDocument().getDocumentId(),
                note.getNoteType(),
                note.getNote(),
                note.getCreatedAt(),
                note.getCreatedBy(),
                note.getUpdatedAt(),
                note.getUpdatedBy());
    }

    public WorkflowHistoryResponse toWorkflowHistoryResponse(DocumentWorkflowHistory history) {
        return new WorkflowHistoryResponse(
                history.getWorkflowId(),
                history.getDocument().getDocumentId(),
                history.getFromStatus(),
                history.getToStatus(),
                history.getComment(),
                history.getAmendmentSections(),
                history.getAmendmentComment(),
                history.getRejectionReason(),
                history.getChangedAt(),
                history.getChangedBy());
    }

    private CategorySummaryResponse toCategorySummary(Category category) {
        return category == null ? null : new CategorySummaryResponse(category.getCategoryId(), category.getName());
    }

    private DepartmentSummaryResponse toDepartmentSummary(Department department) {
        return department == null
                ? null
                : new DepartmentSummaryResponse(department.getDepartmentId(), department.getName());
    }

    private DocumentUploaderResponse toDocumentUploaderResponse(Document document) {
        return new DocumentUploaderResponse(
                document.getUploaderUsername(),
                document.getUploaderFullName(),
                document.getUploaderEmail(),
                document.getUploaderDepartmentId() == null
                        ? null
                        : new DepartmentSummaryResponse(
                                document.getUploaderDepartmentId(),
                                document.getUploaderDepartmentName()));
    }
}
