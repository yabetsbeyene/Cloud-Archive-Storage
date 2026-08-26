package com.digitalarchive.controller;

import com.digitalarchive.dto.AppUserResponse;
import com.digitalarchive.dto.CreateManagedUserRequest;
import com.digitalarchive.dto.ManagedUserResponse;
import com.digitalarchive.dto.UpdateManagedUserRequest;
import com.digitalarchive.service.AppUserService;
import com.digitalarchive.service.ManagedUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final AppUserService appUserService;
    private final ManagedUserService managedUserService;
    private final AccountController accountController;

    @GetMapping("/me")
    public ResponseEntity<AppUserResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return appUserService.getActive(actorId(jwt))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<ManagedUserResponse> listAll(@AuthenticationPrincipal Jwt jwt) {
        return managedUserService.list(jwt);
    }

    @GetMapping("/{sub}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ManagedUserResponse getBySub(@PathVariable UUID sub, @AuthenticationPrincipal Jwt jwt) {
        return managedUserService.get(sub, jwt);
    }

    @GetMapping("/{sub}/profile-picture")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable UUID sub) {
        return accountController.profilePicture(sub);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ManagedUserResponse> create(
            @Valid @RequestBody CreateManagedUserRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        ManagedUserResponse created = managedUserService.create(request, actorId(jwt), jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{sub}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ManagedUserResponse update(
            @PathVariable UUID sub,
            @Valid @RequestBody UpdateManagedUserRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return managedUserService.update(sub, request, actorId(jwt), jwt);
    }

    @DeleteMapping("/{sub}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deactivate(
            @PathVariable UUID sub,
            @AuthenticationPrincipal Jwt jwt) {
        managedUserService.deactivate(sub, actorId(jwt), jwt);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{sub}/permanent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deletePermanently(
            @PathVariable UUID sub,
            @AuthenticationPrincipal Jwt jwt) {
        managedUserService.deletePermanently(sub, actorId(jwt), jwt);
        return ResponseEntity.noContent().build();
    }

    private UUID actorId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
