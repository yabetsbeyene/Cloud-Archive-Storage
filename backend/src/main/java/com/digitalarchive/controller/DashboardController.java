package com.digitalarchive.controller;

import com.digitalarchive.dto.DashboardResponse;
import com.digitalarchive.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardResponse getDashboard(@AuthenticationPrincipal Jwt jwt) {
        return dashboardService.getDashboard(
                UUID.fromString(jwt.getSubject()),
                realmRoles(jwt));
    }

    private List<String> realmRoles(Jwt jwt) {
        Object realmAccessClaim = jwt.getClaim("realm_access");
        if (!(realmAccessClaim instanceof Map<?, ?> realmAccess)) {
            return List.of();
        }
        Object rolesClaim = realmAccess.get("roles");
        if (!(rolesClaim instanceof List<?> roles)) {
            return List.of();
        }
        return roles.stream().map(Object::toString).toList();
    }
}
