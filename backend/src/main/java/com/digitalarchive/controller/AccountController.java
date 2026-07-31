package com.digitalarchive.controller;

import com.digitalarchive.dto.AccountProfileResponse;
import com.digitalarchive.dto.ChangePasswordRequest;
import com.digitalarchive.dto.UpdateAccountProfileRequest;
import com.digitalarchive.dto.UpdateThemePreferenceRequest;
import com.digitalarchive.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

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

    private UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
