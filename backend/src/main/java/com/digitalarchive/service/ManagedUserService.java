package com.digitalarchive.service;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.domain.entity.Department;
import com.digitalarchive.domain.enums.ApplicationRole;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.domain.enums.ThemePreference;
import com.digitalarchive.dto.CreateManagedUserRequest;
import com.digitalarchive.dto.DepartmentSummaryResponse;
import com.digitalarchive.dto.ManagedUserResponse;
import com.digitalarchive.dto.UpdateManagedUserRequest;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.repository.AppUserRepository;
import com.digitalarchive.repository.DepartmentRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagedUserService {

    private final KeycloakAdminService keycloakAdminService;
    private final AppUserRepository appUserRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;
    private final EntityManager entityManager;
    private final FileStorageService fileStorageService;
    private final DocumentAccessService documentAccessService;

    @Transactional(readOnly = true)
    public List<ManagedUserResponse> list(Jwt jwt) {
        DocumentAccessService.AccessContext access = documentAccessService.context(jwt);
        Map<UUID, AppUser> profiles = appUserRepository.findAll().stream()
                .collect(Collectors.toMap(AppUser::getUserSub, Function.identity()));
        return keycloakAdminService.listUsers().stream()
                .filter(identity -> access.has(ApplicationRole.ADMIN)
                        || (sameDepartment(profiles.get(identity.id()), access.departmentId())
                                && Set.of(ApplicationRole.DEPT_USER, ApplicationRole.VIEWER).contains(identity.role())))
                .map(identity -> toResponse(identity, profiles.get(identity.id())))
                .sorted(Comparator.comparing(ManagedUserResponse::fullName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional(readOnly = true)
    public ManagedUserResponse get(UUID userId, Jwt jwt) {
        requireManageTarget(userId, documentAccessService.context(jwt));
        return toResponse(
                keycloakAdminService.getUser(userId),
                appUserRepository.findById(userId).orElse(null));
    }

    @Transactional
    public ManagedUserResponse create(CreateManagedUserRequest request, UUID actorId, Jwt jwt) {
        DocumentAccessService.AccessContext access = documentAccessService.context(jwt);
        validateProvisioning(request.role(), request.departmentId(), access);
        Department department = resolveDepartment(request.departmentId());
        KeycloakAdminService.KeycloakUser identity = keycloakAdminService.createUser(
                request.username(),
                request.fullName(),
                request.email(),
                request.role(),
                department == null ? null : department.getName(),
                true);
        try {
            AppUser profile = AppUser.builder()
                    .userSub(identity.id())
                    .username(identity.username())
                    .fullName(identity.fullName())
                    .email(identity.email())
                    .department(department)
                    .isActive(true)
                    .themePreference(ThemePreference.SYSTEM)
                    .build();
            AppUser saved = appUserRepository.saveAndFlush(profile);
            entityManager.refresh(saved);
            auditService.log(actorId, AuditAction.CREATE, ResourceType.USER,
                    saved.getUserSub(), "Created user " + identity.username()
                            + " with role " + request.role().name()
                            + " and sent an account setup invitation to " + identity.email());
            keycloakAdminService.sendInvitationEmail(identity.id());
            return toResponse(identity, saved);
        } catch (RuntimeException exception) {
            keycloakAdminService.deleteUser(identity.id());
            throw exception;
        }
    }

    @Transactional
    public ManagedUserResponse update(
            UUID userId,
            UpdateManagedUserRequest request,
            UUID actorId,
            Jwt jwt) {
        DocumentAccessService.AccessContext access = documentAccessService.context(jwt);
        requireManageTarget(userId, access);
        validateProvisioning(request.role(), request.departmentId(), access);
        if (userId.equals(actorId)
                && (request.role() != ApplicationRole.ADMIN || !request.isActive())) {
            throw new IllegalArgumentException(
                    "You cannot remove your own administrator role or deactivate your own account");
        }

        Department department = resolveDepartment(request.departmentId());
        KeycloakAdminService.KeycloakUser identity = keycloakAdminService.updateUser(
                userId,
                request.fullName(),
                request.email(),
                request.role(),
                department == null ? null : department.getName(),
                request.isActive());

        AppUser profile = appUserRepository.findById(userId)
                .orElseGet(() -> AppUser.builder()
                        .userSub(userId)
                        .username(identity.username())
                        .themePreference(ThemePreference.SYSTEM)
                        .build());
        profile.setUsername(identity.username());
        profile.setFullName(identity.fullName());
        profile.setEmail(identity.email());
        profile.setDepartment(department);
        profile.setIsActive(request.isActive());
        profile.setDeletedAt(request.isActive() ? null : OffsetDateTime.now());
        profile.setDeletedBy(request.isActive() ? null : actorId);
        AppUser saved = appUserRepository.save(profile);

        return toResponse(identity, saved);
    }

    @Transactional
    public void deactivate(UUID userId, UUID actorId, Jwt jwt) {
        requireManageTarget(userId, documentAccessService.context(jwt));
        if (userId.equals(actorId)) {
            throw new IllegalArgumentException("You cannot deactivate your own account");
        }
        keycloakAdminService.setEnabled(userId, false);
        try {
            appUserRepository.findById(userId).ifPresent(profile -> {
                profile.setIsActive(false);
                profile.setDeletedAt(OffsetDateTime.now());
                profile.setDeletedBy(actorId);
                appUserRepository.save(profile);
            });
            auditService.log(actorId, AuditAction.DELETE, ResourceType.USER,
                    userId, "Deactivated Keycloak and application user");
        } catch (RuntimeException exception) {
            keycloakAdminService.setEnabled(userId, true);
            throw exception;
        }
    }

    @Transactional
    public void deletePermanently(UUID userId, UUID actorId, Jwt jwt) {
        requireManageTarget(userId, documentAccessService.context(jwt));
        if (userId.equals(actorId)) {
            throw new IllegalArgumentException("You cannot permanently delete your own account");
        }

        KeycloakAdminService.KeycloakUser identity = keycloakAdminService.getUser(userId);
        AppUser profile = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application user profile not found: " + userId));

        String deletedIdentity = "deleted-" + userId;
        profile.setUsername(deletedIdentity);
        profile.setFullName("Deleted user");
        profile.setEmail(deletedIdentity + "@deleted.invalid");
        profile.setDepartment(null);
        fileStorageService.delete(profile.getProfilePictureFileName());
        profile.setProfilePictureFileName(null);
        profile.setProfilePictureMimeType(null);
        profile.setProfilePictureUpdatedAt(null);
        profile.setIsActive(false);
        profile.setDeletedAt(OffsetDateTime.now());
        profile.setDeletedBy(actorId);
        appUserRepository.save(profile);

        auditService.log(actorId, AuditAction.DELETE, ResourceType.USER,
                userId, "Permanently deleted account " + identity.username()
                        + "; historical records retain an anonymized user reference");

        keycloakAdminService.deleteUser(userId);
    }

    private Department resolveDepartment(UUID departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId)
                .filter(department -> department.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found: " + departmentId));
    }

    private void validateProvisioning(ApplicationRole role, UUID departmentId,
            DocumentAccessService.AccessContext access) {
        if (access.has(ApplicationRole.ADMIN)) {
            if (role == ApplicationRole.MANAGER && departmentId == null) {
                throw new IllegalArgumentException(
                        "A department is required when creating or updating a department manager");
            }
            return;
        }
        if (!access.has(ApplicationRole.MANAGER)
                || !Set.of(ApplicationRole.DEPT_USER, ApplicationRole.VIEWER).contains(role)
                || departmentId == null
                || !departmentId.equals(access.departmentId())) {
            throw new AccessDeniedException(
                    "Managers may only manage regular users in their own department");
        }
    }

    private void requireManageTarget(UUID userId, DocumentAccessService.AccessContext access) {
        if (access.has(ApplicationRole.ADMIN)) {
            return;
        }
        if (!access.has(ApplicationRole.MANAGER)) {
            throw new AccessDeniedException("Only administrators and department managers may manage users");
        }
        AppUser target = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application user not found: " + userId));
        if (!sameDepartment(target, access.departmentId())) {
            throw new AccessDeniedException("You may only manage users in your department");
        }
        ApplicationRole targetRole = keycloakAdminService.getUser(userId).role();
        if (!Set.of(ApplicationRole.DEPT_USER, ApplicationRole.VIEWER).contains(targetRole)) {
            throw new AccessDeniedException("Managers may only manage regular users");
        }
    }

    private boolean sameDepartment(AppUser user, UUID departmentId) {
        return user != null && user.getDepartment() != null && departmentId != null
                && departmentId.equals(user.getDepartment().getDepartmentId());
    }

    private ManagedUserResponse toResponse(
            KeycloakAdminService.KeycloakUser identity,
            AppUser profile) {
        Department department = profile == null ? null : profile.getDepartment();
        return new ManagedUserResponse(
                identity.id(),
                identity.username(),
                identity.fullName(),
                identity.email(),
                identity.role(),
                department == null
                        ? null
                        : new DepartmentSummaryResponse(department.getDepartmentId(), department.getName()),
                identity.enabled() && (profile == null || Boolean.TRUE.equals(profile.getIsActive())),
                profile == null ? null : profile.getCreatedAt(),
                profile == null ? null : profile.getUpdatedAt(),
                profile == null ? null : profile.getProfilePictureUpdatedAt());
    }
}
