package com.digitalarchive.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {

    public static ApiErrorResponse of(
            int status,
            String error,
            String message,
            String path,
            Map<String, String> fieldErrors) {
        return new ApiErrorResponse(
                OffsetDateTime.now(),
                status,
                error,
                message,
                path,
                fieldErrors == null ? Map.of() : fieldErrors);
    }
}
