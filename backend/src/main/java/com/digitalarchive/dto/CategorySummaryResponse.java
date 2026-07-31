package com.digitalarchive.dto;

import java.util.UUID;

public record CategorySummaryResponse(
        UUID categoryId,
        String name) {
}
