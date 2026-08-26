package com.digitalarchive.domain.entity;

import com.digitalarchive.domain.enums.DocumentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_workflow_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentWorkflowHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "workflow_id", updatable = false, nullable = false)
    private UUID workflowId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "from_status")
    private DocumentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "to_status", nullable = false)
    private DocumentStatus toStatus;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Column(name = "amendment_sections", columnDefinition = "text")
    private String amendmentSections;

    @Column(name = "amendment_comment", columnDefinition = "text")
    private String amendmentComment;

    @Column(name = "rejection_reason", columnDefinition = "text")
    private String rejectionReason;

    @Column(name = "changed_at", insertable = false, updatable = false)
    private OffsetDateTime changedAt;

    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;
}
