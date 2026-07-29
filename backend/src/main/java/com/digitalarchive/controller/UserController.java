package com.digitalarchive.controller;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final AppUserRepository appUserRepository;

    @GetMapping
    public List<AppUser> listAll() {
        return appUserRepository.findAll();
    }

    @GetMapping("/{sub}")
    public ResponseEntity<AppUser> getBySub(@PathVariable UUID sub) {
        return appUserRepository.findById(sub)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<AppUser> create(@RequestBody AppUser user) {
        AppUser saved = appUserRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{sub}")
    @PreAuthorize("hasAnyRole('ADMIN') or #sub.toString() == authentication.name")
    public ResponseEntity<AppUser> update(@PathVariable UUID sub, @RequestBody AppUser updated) {
        return appUserRepository.findById(sub)
                .map(existing -> {
                    existing.setFullName(updated.getFullName());
                    existing.setEmail(updated.getEmail());
                    existing.setDepartment(updated.getDepartment());
                    return ResponseEntity.ok(appUserRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{sub}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID sub) {
        if (!appUserRepository.existsById(sub)) {
            return ResponseEntity.notFound().build();
        }
        appUserRepository.deleteById(sub);
        return ResponseEntity.noContent().build();
    }
}