package com.digitalarchive.service;

import com.digitalarchive.domain.entity.AppUser;
import com.digitalarchive.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private static final int MAX_FULL_NAME_LENGTH = 200;
    private static final int MAX_EMAIL_LENGTH = 255;

    private final AppUserRepository appUserRepository;

    /**
     * Ensures every valid Keycloak identity has a corresponding application user
     * before a protected controller can write a foreign-keyed record.
     */
    @Transactional
    public void synchronize(Jwt jwt) {
        UUID userSub;
        try {
            userSub = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("The authenticated user has an invalid subject identifier");
        }

        String username = firstNonBlank(jwt.getClaimAsString("preferred_username"), userSub.toString());
        String fullName = firstNonBlank(jwt.getClaimAsString("name"), username);
        String email = firstNonBlank(jwt.getClaimAsString("email"), userSub + "@keycloak.local");

        appUserRepository.synchronizeIdentity(
                userSub,
                truncate(username, 150),
                truncate(fullName, MAX_FULL_NAME_LENGTH),
                truncate(email, MAX_EMAIL_LENGTH));

        AppUser synchronizedUser = appUserRepository.findById(userSub)
                .orElseThrow(() -> new IllegalStateException("Unable to synchronize the authenticated user"));

        if (!Boolean.TRUE.equals(synchronizedUser.getIsActive()) || synchronizedUser.getDeletedAt() != null) {
            throw new AccessDeniedException("The application user is inactive");
        }
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred.trim() : fallback;
    }

    private String truncate(String value, int maximumLength) {
        return value.length() <= maximumLength ? value : value.substring(0, maximumLength);
    }
}
