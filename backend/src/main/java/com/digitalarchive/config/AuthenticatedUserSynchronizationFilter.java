package com.digitalarchive.config;

import com.digitalarchive.service.AuthenticatedUserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserSynchronizationFilter extends OncePerRequestFilter {

    private final AuthenticatedUserService authenticatedUserService;
    private final ApiSecurityErrorWriter securityErrorWriter;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuthentication
                && authentication.isAuthenticated()) {
            try {
                authenticatedUserService.synchronize(jwtAuthentication.getToken());
            } catch (AccessDeniedException exception) {
                securityErrorWriter.write(
                        request,
                        response,
                        HttpServletResponse.SC_FORBIDDEN,
                        "Forbidden",
                        exception.getMessage());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
