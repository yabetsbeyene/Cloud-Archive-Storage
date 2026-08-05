package com.digitalarchive.service;

import com.digitalarchive.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditRetentionService {

    private final AuditLogRepository auditLogRepository;

    @Value("${app.audit.retention-days:7}")
    private long retentionDays;

    @Scheduled(
            initialDelayString = "${app.audit.cleanup-initial-delay-ms:10000}",
            fixedDelayString = "${app.audit.cleanup-interval-ms:3600000}")
    @Transactional
    public void deleteExpiredEntries() {
        int deleted = auditLogRepository.deleteCreatedBefore(
                OffsetDateTime.now().minusDays(retentionDays));
        if (deleted > 0) {
            log.info("Deleted {} audit entries older than {} days", deleted, retentionDays);
        }
    }
}
