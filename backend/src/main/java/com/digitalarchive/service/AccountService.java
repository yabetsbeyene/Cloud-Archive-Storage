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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final KeycloakAdminService keycloakAdminService;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;

    private static final long MAX_PROFILE_PICTURE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> PROFILE_PICTURE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp");

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
                    "Password must be at least 14 characters and contain uppercase, lowercase, "
                            + "numeric, and special characters");
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

    @Transactional
    public AccountProfileResponse updateProfilePicture(UUID userId, MultipartFile file) {
        validateProfilePicture(file);
        AppUser profile = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application user profile not found"));
        String previousFileName = profile.getProfilePictureFileName();
        FileStorageService.StoredFile stored = fileStorageService.store(file);
        try {
            profile.setProfilePictureFileName(stored.storedFileName());
            profile.setProfilePictureMimeType(normalizedContentType(file));
            profile.setProfilePictureUpdatedAt(OffsetDateTime.now());
            AppUser saved = appUserRepository.save(profile);
            if (previousFileName != null && !previousFileName.equals(stored.storedFileName())) {
                fileStorageService.delete(previousFileName);
            }
            auditService.log(userId, AuditAction.UPDATE, ResourceType.USER, userId,
                    "Updated own profile picture");
            return response(keycloakAdminService.getUser(userId), saved);
        } catch (RuntimeException exception) {
            fileStorageService.delete(stored.storedFileName());
            throw exception;
        }
    }

    @Transactional
    public AccountProfileResponse removeProfilePicture(UUID userId) {
        AppUser profile = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application user profile not found"));
        String storedFileName = profile.getProfilePictureFileName();
        profile.setProfilePictureFileName(null);
        profile.setProfilePictureMimeType(null);
        profile.setProfilePictureUpdatedAt(null);
        AppUser saved = appUserRepository.save(profile);
        fileStorageService.delete(storedFileName);
        auditService.log(userId, AuditAction.UPDATE, ResourceType.USER, userId,
                "Removed own profile picture");
        return response(keycloakAdminService.getUser(userId), saved);
    }

    @Transactional(readOnly = true)
    public ProfilePictureInfo getProfilePicture(UUID userId) {
        AppUser profile = appUserRepository.findById(userId)
                .filter(candidate -> candidate.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
        if (profile.getProfilePictureFileName() == null) {
            throw new ResourceNotFoundException("This user has no profile picture");
        }
        return new ProfilePictureInfo(
                profile.getProfilePictureFileName(),
                profile.getProfilePictureMimeType());
    }

    private void validateProfilePicture(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose an image to upload");
        }
        if (file.getSize() > MAX_PROFILE_PICTURE_BYTES) {
            throw new IllegalArgumentException("Profile pictures must be 5 MB or smaller");
        }
        if (!PROFILE_PICTURE_TYPES.contains(normalizedContentType(file))) {
            throw new IllegalArgumentException("Use a JPEG, PNG, or WebP image");
        }
        if (!hasExpectedImageSignature(file, normalizedContentType(file))) {
            throw new IllegalArgumentException("The selected file is not a valid image");
        }
    }

    private boolean hasExpectedImageSignature(MultipartFile file, String contentType) {
        try {
            byte[] bytes = file.getBytes();
            return switch (contentType) {
                case "image/jpeg" -> bytes.length >= 3
                        && (bytes[0] & 0xff) == 0xff
                        && (bytes[1] & 0xff) == 0xd8
                        && (bytes[2] & 0xff) == 0xff;
                case "image/png" -> bytes.length >= 8
                        && (bytes[0] & 0xff) == 0x89
                        && bytes[1] == 0x50
                        && bytes[2] == 0x4e
                        && bytes[3] == 0x47;
                case "image/webp" -> bytes.length >= 12
                        && bytes[0] == 'R' && bytes[1] == 'I'
                        && bytes[2] == 'F' && bytes[3] == 'F'
                        && bytes[8] == 'W' && bytes[9] == 'E'
                        && bytes[10] == 'B' && bytes[11] == 'P';
                default -> false;
            };
        } catch (IOException exception) {
            throw new IllegalArgumentException("The selected image could not be read");
        }
    }

    private String normalizedContentType(MultipartFile file) {
        return file.getContentType() == null
                ? ""
                : file.getContentType().split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }

    private boolean isStrongPassword(String password) {
        return password.length() >= 14
                && password.chars().anyMatch(Character::isUpperCase)
                && password.chars().anyMatch(Character::isLowerCase)
                && password.chars().anyMatch(Character::isDigit)
                && password.chars().anyMatch(character ->
                        !Character.isLetterOrDigit(character) && !Character.isWhitespace(character));
    }

    private AccountProfileResponse response(
            KeycloakAdminService.KeycloakUser identity,
            AppUser profile) {
        Department department = profile.getDepartment();
        return new AccountProfileResponse(
                profile.getUserSub(),
                identity.username(),
                identity.fullName(),
                identity.email(),
                identity.role(),
                department == null
                        ? null
                        : new DepartmentSummaryResponse(
                                department.getDepartmentId(),
                                department.getName()),
                profile.getThemePreference(),
                profile.getProfilePictureUpdatedAt());
    }

    public record ProfilePictureInfo(String storedFileName, String mimeType) {
    }
}
