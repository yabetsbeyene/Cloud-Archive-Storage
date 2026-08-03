package com.digitalarchive.controller;

import com.digitalarchive.dto.AccountProfileResponse;
import com.digitalarchive.dto.ChangePasswordRequest;
import com.digitalarchive.dto.UpdateAccountProfileRequest;
import com.digitalarchive.dto.UpdateThemePreferenceRequest;
import com.digitalarchive.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;
    private final com.digitalarchive.service.FileStorageService fileStorageService;

    @GetMapping
    public AccountProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return accountService.get(actorId(jwt));
    }

    @PutMapping("/profile")
    public AccountProfileResponse updateProfile(
            @Valid @RequestBody UpdateAccountProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return accountService.updateProfile(actorId(jwt), request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        accountService.changePassword(actorId(jwt), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/theme")
    public AccountProfileResponse updateTheme(
            @Valid @RequestBody UpdateThemePreferenceRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return accountService.updateTheme(actorId(jwt), request);
    }

    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountProfileResponse updateProfilePicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        return accountService.updateProfilePicture(actorId(jwt), file);
    }

    @DeleteMapping("/profile-picture")
    public AccountProfileResponse removeProfilePicture(@AuthenticationPrincipal Jwt jwt) {
        return accountService.removeProfilePicture(actorId(jwt));
    }

    @GetMapping("/profile-picture")
    public ResponseEntity<Resource> getOwnProfilePicture(@AuthenticationPrincipal Jwt jwt) {
        return profilePicture(actorId(jwt));
    }

    public ResponseEntity<Resource> profilePicture(UUID userId) {
        AccountService.ProfilePictureInfo picture = accountService.getProfilePicture(userId);
        try {
            Resource resource = new UrlResource(
                    fileStorageService.resolve(picture.storedFileName()).toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
                    .header(HttpHeaders.CONTENT_TYPE, picture.mimeType())
                    .header("X-Content-Type-Options", "nosniff")
                    .body(resource);
        } catch (MalformedURLException exception) {
            throw new IllegalStateException("Stored profile picture is unavailable", exception);
        }
    }

    private UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
