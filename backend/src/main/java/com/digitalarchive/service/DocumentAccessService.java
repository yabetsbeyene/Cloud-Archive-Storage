package com.digitalarchive.service;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.domain.entity.Document;
import com.digitalarchive.domain.enums.ApplicationRole;
import com.digitalarchive.domain.enums.ClassificationLevel;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * The shared authorization policy for document metadata and document files.
 */
@Service
@RequiredArgsConstructor
public class DocumentAccessService {

    private final AppUserRepository appUserRepository;

    public AccessContext context(Jwt jwt) {
        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("The authenticated user has an invalid identifier");
        }

        AppUser user = appUserRepository.findById(userId)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getIsActive())
                        && candidate.getDeletedAt() == null)
                .orElseThrow(() -> new AccessDeniedException(
                        "An active application profile is required"));

        EnumSet<ApplicationRole> roles = EnumSet.noneOf(ApplicationRole.class);
        Object realmAccessClaim = jwt.getClaim("realm_access");
        if (realmAccessClaim instanceof Map<?, ?> realmAccess
                && realmAccess.get("roles") instanceof List<?> roleNames) {
            for (Object roleName : roleNames) {
                try {
                    roles.add(ApplicationRole.valueOf(String.valueOf(roleName)));
                } catch (IllegalArgumentException ignored) {
                    // Keycloak infrastructure roles are intentionally ignored.
                }
            }
        }

        UUID departmentId = user.getDepartment() == null
                ? null
                : user.getDepartment().getDepartmentId();
        return new AccessContext(userId, departmentId, Set.copyOf(roles));
    }

    public boolean canRead(Document document, AccessContext access) {
        if (access.hasAny(ApplicationRole.ADMIN, ApplicationRole.ARCHIVIST)) {
            return true;
        }

        boolean owner = document.getCreatedBy().equals(access.userId());
        boolean sameDepartment = access.departmentId() != null
                && document.getDepartment() != null
                && access.departmentId().equals(document.getDepartment().getDepartmentId());
        ClassificationLevel classification = document.getClassification();

        if (owner) {
            return true;
        }
        if (access.has(ApplicationRole.MANAGER)) {
            return sameDepartment
                    && document.getStatus() != com.digitalarchive.domain.enums.DocumentStatus.DRAFT
                    && document.getStatus() != com.digitalarchive.domain.enums.DocumentStatus.REJECTED;
        }
        if (access.has(ApplicationRole.DEPT_USER)) {
            return classification == ClassificationLevel.PUBLIC
                    || (sameDepartment && classification != ClassificationLevel.SECRET);
        }
        if (access.has(ApplicationRole.VIEWER)) {
            return classification == ClassificationLevel.PUBLIC
                    || (sameDepartment && classification == ClassificationLevel.INTERNAL);
        }
        return false;
    }

    public void requireRead(Document document, AccessContext access) {
        if (!canRead(document, access)) {
            throw new AccessDeniedException("You do not have permission to access this document");
        }
    }

    public void requireWrite(Document document, AccessContext access) {
        boolean owner = document.getCreatedBy().equals(access.userId());
        boolean sameDepartment = access.departmentId() != null
                && document.getDepartment() != null
                && access.departmentId().equals(document.getDepartment().getDepartmentId());
        boolean editableByOwner = owner
                && document.getStatus() == com.digitalarchive.domain.enums.DocumentStatus.DRAFT;
        boolean allowed = access.hasAny(ApplicationRole.ADMIN, ApplicationRole.ARCHIVIST)
                || (access.has(ApplicationRole.DEPT_USER) && editableByOwner);
        if (!allowed) {
            throw new AccessDeniedException("You do not have permission to modify this document");
        }
    }

    public void requireDelete(Document document, AccessContext access) {
        boolean owner = document.getCreatedBy().equals(access.userId());
        boolean uploaderCanDelete = access.has(ApplicationRole.DEPT_USER)
                && owner
                && document.getStatus() != com.digitalarchive.domain.enums.DocumentStatus.ARCHIVED;
        boolean allowed = access.hasAny(ApplicationRole.ADMIN, ApplicationRole.ARCHIVIST)
                || uploaderCanDelete;
        if (!allowed) {
            throw new AccessDeniedException(
                    "You can only delete your own document before it is archived");
        }
    }

    public record AccessContext(
            UUID userId,
            UUID departmentId,
            Set<ApplicationRole> roles) {

        public boolean has(ApplicationRole role) {
            return roles.contains(role);
        }

        public boolean hasAny(ApplicationRole... candidates) {
            for (ApplicationRole candidate : candidates) {
                if (has(candidate)) {
                    return true;
                }
            }
            return false;
        }
    }
}
