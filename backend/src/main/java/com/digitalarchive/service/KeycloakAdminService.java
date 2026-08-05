package com.digitalarchive.service;

import com.digitalarchive.domain.enums.ApplicationRole;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    private static final List<String> APPLICATION_ROLES =
            Arrays.stream(ApplicationRole.values()).map(Enum::name).toList();

    private final RestClient.Builder restClientBuilder;

    @Value("${app.keycloak-admin.server-url}")
    private String serverUrl;

    @Value("${app.keycloak-admin.realm}")
    private String realm;

    @Value("${app.keycloak-admin.client-id}")
    private String clientId;

    @Value("${app.keycloak-admin.client-secret}")
    private String clientSecret;

    @Value("${app.keycloak-admin.frontend-client-id}")
    private String frontendClientId;

    @Value("${app.keycloak-admin.frontend-url}")
    private String frontendUrl;

    @Value("${app.keycloak-admin.invitation-lifespan-seconds}")
    private int invitationLifespanSeconds;

    public List<KeycloakUser> listUsers() {
        try {
            KeycloakUserRepresentation[] users = client().get()
                    .uri("/admin/realms/{realm}/users?max=1000", realm)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .retrieve()
                    .body(KeycloakUserRepresentation[].class);
            if (users == null) {
                return List.of();
            }
            return Arrays.stream(users)
                    .filter(user -> user.id() != null)
                    .map(user -> toManagedUser(user, applicationRole(user.id())))
                    .toList();
        } catch (RestClientResponseException exception) {
            throw translate(exception, "load users");
        }
    }

    public KeycloakUser getUser(UUID userId) {
        try {
            KeycloakUserRepresentation user = client().get()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .retrieve()
                    .body(KeycloakUserRepresentation.class);
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Keycloak user not found");
            }
            return toManagedUser(user, applicationRole(user.id()));
        } catch (RestClientResponseException exception) {
            throw translate(exception, "load the user");
        }
    }

    public KeycloakUser createUser(
            String username,
            String fullName,
            String email,
            ApplicationRole role,
            String departmentName,
            boolean enabled) {
        String token = accessToken();
        NameParts name = splitName(fullName);
        Map<String, Object> representation = new HashMap<>();
        representation.put("username", username.trim());
        representation.put("firstName", name.firstName());
        representation.put("lastName", name.lastName());
        representation.put("email", email.trim());
        representation.put("emailVerified", false);
        representation.put("enabled", enabled);
        representation.put("requiredActions", List.of("VERIFY_EMAIL", "UPDATE_PASSWORD"));
        representation.put("attributes", invitationAttributes(role, departmentName));
        try {
            URI location = client().post()
                    .uri("/admin/realms/{realm}/users", realm)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(representation)
                    .retrieve()
                    .toBodilessEntity()
                    .getHeaders()
                    .getLocation();
            if (location == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY, "Keycloak did not return the new user identifier");
            }
            UUID userId = UUID.fromString(location.getPath().substring(location.getPath().lastIndexOf('/') + 1));
            try {
                replaceApplicationRole(userId, role, token);
                return getUser(userId);
            } catch (RuntimeException exception) {
                deleteUser(userId);
                throw exception;
            }
        } catch (RestClientResponseException exception) {
            throw translate(exception, "create the user");
        }
    }

    public KeycloakUser updateUser(
            UUID userId,
            String fullName,
            String email,
            ApplicationRole role,
            String departmentName,
            boolean enabled) {
        String token = accessToken();
        KeycloakUser current = getUser(userId);
        NameParts name = splitName(fullName);
        Map<String, Object> representation = Map.of(
                "username", current.username(),
                "firstName", name.firstName(),
                "lastName", name.lastName(),
                "email", email.trim(),
                "attributes", invitationAttributes(role, departmentName),
                "enabled", enabled);
        try {
            client().put()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(representation)
                    .retrieve()
                    .toBodilessEntity();
            replaceApplicationRole(userId, role, token);
            return getUser(userId);
        } catch (RestClientResponseException exception) {
            throw translate(exception, "update the user");
        }
    }

    public void setEnabled(UUID userId, boolean enabled) {
        KeycloakUser current = getUser(userId);
        try {
            client().put()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "username", current.username(),
                            "email", current.email(),
                            "enabled", enabled))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw translate(exception, enabled ? "activate the user" : "deactivate the user");
        }
    }

    public KeycloakUser updateOwnProfile(
            UUID userId,
            String username,
            String fullName,
            String email) {
        String token = accessToken();
        KeycloakUser current = getUser(userId);
        NameParts name = splitName(fullName);
        Map<String, Object> representation = new HashMap<>();
        representation.put("username", username.trim());
        representation.put("firstName", name.firstName());
        representation.put("lastName", name.lastName());
        representation.put("email", email.trim());
        representation.put("emailVerified", true);
        representation.put("enabled", current.enabled());
        try {
            client().put()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(representation)
                    .retrieve()
                    .toBodilessEntity();
            return getUser(userId);
        } catch (RestClientResponseException exception) {
            throw translate(exception, "update your account profile");
        }
    }

    public void changePassword(UUID userId, String newPassword) {
        try {
            client().put()
                    .uri("/admin/realms/{realm}/users/{id}/reset-password", realm, userId)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "type", "password",
                            "value", newPassword,
                            "temporary", false))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw translate(exception, "change your password");
        }
    }

    public void sendInvitationEmail(UUID userId) {
        try {
            client().put()
                    .uri(
                            "/admin/realms/{realm}/users/{id}/execute-actions-email"
                                    + "?client_id={frontendClientId}"
                                    + "&redirect_uri={frontendUrl}"
                                    + "&lifespan={lifespan}",
                            realm,
                            userId,
                            frontendClientId,
                            frontendUrl,
                            invitationLifespanSeconds)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of("VERIFY_EMAIL", "UPDATE_PASSWORD"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "The account was not created because its invitation email could not be sent. "
                            + "Check the SMTP configuration and recipient address.");
        }
    }

    public void deleteUser(UUID userId) {
        try {
            client().delete()
                    .uri("/admin/realms/{realm}/users/{id}", realm, userId)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() != 404) {
                throw translate(exception, "remove the incomplete user");
            }
        }
    }

    private void replaceApplicationRole(UUID userId, ApplicationRole role, String token) {
        List<KeycloakRoleRepresentation> currentRoles = realmRoles(userId, token).stream()
                .filter(current -> APPLICATION_ROLES.contains(current.name()))
                .toList();
        if (!currentRoles.isEmpty()) {
            client().method(org.springframework.http.HttpMethod.DELETE)
                    .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", realm, userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(currentRoles)
                    .retrieve()
                    .toBodilessEntity();
        }
        KeycloakRoleRepresentation selected = client().get()
                .uri("/admin/realms/{realm}/roles/{role}", realm, role.name())
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(KeycloakRoleRepresentation.class);
        if (selected == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "The selected application role is missing in Keycloak");
        }
        client().post()
                .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", realm, userId)
                .headers(headers -> headers.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(List.of(selected))
                .retrieve()
                .toBodilessEntity();
    }

    private ApplicationRole applicationRole(String userId) {
        return realmRoles(UUID.fromString(userId), accessToken()).stream()
                .map(KeycloakRoleRepresentation::name)
                .filter(APPLICATION_ROLES::contains)
                .findFirst()
                .map(ApplicationRole::valueOf)
                .orElse(ApplicationRole.VIEWER);
    }

    private List<KeycloakRoleRepresentation> realmRoles(UUID userId, String token) {
        List<KeycloakRoleRepresentation> roles = client().get()
                .uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", realm, userId)
                .headers(headers -> headers.setBearerAuth(token))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        return roles == null ? List.of() : roles;
    }

    private String accessToken() {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        try {
            Map<String, Object> token = client().post()
                    .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            return Objects.toString(token == null ? null : token.get("access_token"), "");
        } catch (RestClientResponseException exception) {
            throw translate(exception, "authenticate the user-management service");
        }
    }

    private RestClient client() {
        return restClientBuilder.baseUrl(serverUrl).build();
    }

    private KeycloakUser toManagedUser(
            KeycloakUserRepresentation user,
            ApplicationRole role) {
        String fullName = (Objects.toString(user.firstName(), "") + " "
                + Objects.toString(user.lastName(), "")).trim();
        if (fullName.isBlank()) {
            fullName = user.username();
        }
        return new KeycloakUser(
                UUID.fromString(user.id()),
                user.username(),
                fullName,
                Objects.toString(user.email(), ""),
                Boolean.TRUE.equals(user.enabled()),
                role);
    }

    private NameParts splitName(String fullName) {
        String normalized = fullName.trim().replaceAll("\\s+", " ");
        int separator = normalized.indexOf(' ');
        return separator < 0
                ? new NameParts(normalized, "")
                : new NameParts(normalized.substring(0, separator), normalized.substring(separator + 1));
    }

    private Map<String, List<String>> invitationAttributes(
            ApplicationRole role,
            String departmentName) {
        Map<String, List<String>> attributes = new HashMap<>();
        attributes.put("applicationRole", List.of(role.name()));
        attributes.put(
                "applicationDepartment",
                List.of(departmentName == null || departmentName.isBlank()
                        ? "Unassigned"
                        : departmentName));
        return attributes;
    }

    private ResponseStatusException translate(
            RestClientResponseException exception,
            String operation) {
        if (exception.getStatusCode().value() == 409) {
            return new ResponseStatusException(
                    HttpStatus.CONFLICT, "That username or email already exists in Keycloak");
        }
        if (exception.getStatusCode().value() == 404) {
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Keycloak user not found");
        }
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Keycloak could not " + operation + ". Check the admin client configuration.");
    }

    public record KeycloakUser(
            UUID id,
            String username,
            String fullName,
            String email,
            boolean enabled,
            ApplicationRole role) {
    }

    private record KeycloakUserRepresentation(
            String id,
            String username,
            String firstName,
            String lastName,
            String email,
            Boolean enabled) {
    }

    private record KeycloakRoleRepresentation(String id, String name) {
    }

    private record NameParts(String firstName, String lastName) {
    }
}
