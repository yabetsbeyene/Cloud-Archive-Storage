package com.digitalarchive.service;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.domain.entity.Department;
import com.digitalarchive.domain.enums.AuditAction;
import com.digitalarchive.domain.enums.ResourceType;
import com.digitalarchive.dto.AccountProfileResponse;
import com.digitalarchive.dto.ChangePasswordRequest;
import com.digitalarchive.dto.DepartmentSummaryResponse;
import com.digitalarchive.dto.UpdateAccountProfileRequest;
import com.digitalarchive.dto.UpdateThemePreferenceRequest;
import com.digitalarchive.exception.ResourceNotFoundException;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final KeycloakAdminService keycloakAdminService;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public AccountProfileResponse get(UUID userId) {
        return response(
                keycloakAdminService.getUser(userId),
                appUserRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Application user profile not found")));
    }

    @Transactional
    public AccountProfileResponse updateProfile(
            UUID userId,
            UpdateAccountProfileRequest request) {
        KeycloakAdminService.KeycloakUser identity = keycloakAdminService.updateOwnProfile(
                userId,
                request.username(),
                request.fullName(),
                request.email());
        AppUser profile = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application user profile not found"));
        profile.setUsername(identity.username());
        profile.setFullName(identity.fullName());
        profile.setEmail(identity.email());
        AppUser saved = appUserRepository.save(profile);
        auditService.log(
                userId,
                AuditAction.UPDATE,
                ResourceType.USER,
                userId,
                "Updated own account profile");
        return response(identity, saved);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Password confirmation does not match");
        }
        if (!isStrongPassword(request.newPassword())) {
            throw new IllegalArgumentException(
                    "Password must contain uppercase, lowercase and numeric characters");
        }
        keycloakAdminService.changePassword(userId, request.newPassword());
        auditService.log(
                userId,
                AuditAction.UPDATE,
                ResourceType.USER,
                userId,
                "Changed own account password");
    }

    @Transactional
    public AccountProfileResponse updateTheme(
            UUID userId,
            UpdateThemePreferenceRequest request) {
        AppUser profile = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application user profile not found"));
        profile.setThemePreference(request.themePreference());
        AppUser saved = appUserRepository.save(profile);
        auditService.log(
                userId,
                AuditAction.UPDATE,
                ResourceType.USER,
                userId,
                "Changed dashboard theme to " + request.themePreference().name());
        return response(keycloakAdminService.getUser(userId), saved);
    }

    private boolean isStrongPassword(String password) {
        return password.chars().anyMatch(Character::isUpperCase)
                && password.chars().anyMatch(Character::isLowerCase)
                && password.chars().anyMatch(Character::isDigit);
    }

    private AccountProfileResponse response(
            KeycloakAdminService.KeycloakUser identity,
            AppUser profile) {
        Department department = profile.getDepartment();
        return new AccountProfileResponse(
                identity.username(),
                identity.fullName(),
                identity.email(),
                identity.role(),
                department == null
                        ? null
                        : new DepartmentSummaryResponse(
                                department.getDepartmentId(),
                                department.getName()),
                profile.getThemePreference());
    }
}
