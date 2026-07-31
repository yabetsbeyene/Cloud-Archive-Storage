import { api } from './axios'
import type { AuditLog, PageResponse, ResourceType } from '@/types/auditLog'

interface AuditLogFilters {
  page?: number
  size?: number
  actorId?: string
  resourceType?: ResourceType
  resourceId?: string
}

export const auditLogsApi = {
  list: (filters: AuditLogFilters = {}) =>
    api
      .get<PageResponse<AuditLog>>('/audit-logs', { params: filters })
      .then((response) => response.data),
}
