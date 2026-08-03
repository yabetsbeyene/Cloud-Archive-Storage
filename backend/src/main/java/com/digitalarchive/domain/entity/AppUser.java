package com.digitalarchive.domain.entity;

import com.digitalarchive.domain.enums.ThemePreference;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * user_sub is NOT auto-generated — it's the UUID from Keycloak's JWT "sub"
 * claim, set manually when syncing a logged-in user into this table.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @Column(name = "user_sub", updatable = false, nullable = false)
    private UUID userSub;

    @Column(name = "username", nullable = false, length = 150)
    private String username;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_preference", nullable = false, length = 20)
    private ThemePreference themePreference;

    @Column(name = "profile_picture_file_name", length = 500)
    private String profilePictureFileName;

    @Column(name = "profile_picture_mime_type", length = 100)
    private String profilePictureMimeType;

    @Column(name = "profile_picture_updated_at")
    private OffsetDateTime profilePictureUpdatedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "deleted_by")
    private UUID deletedBy;
}
