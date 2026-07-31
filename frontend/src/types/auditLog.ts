export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'ARCHIVE'
  | 'RESTORE'

export type ResourceType = 'DOCUMENT' | 'DOCUMENT_VERSION' | 'USER' | 'DEPARTMENT' | 'CATEGORY'

export interface AuditLog {
  auditLogId: string
  actorId: string | null
  actor: {
    fullName: string
    email: string
    department: { departmentId: string; name: string } | null
  } | null
  action: AuditAction
  resourceType: ResourceType
  resourceId: string | null
  resource: {
    label: string
    category: string | null
    department: string | null
  }
  performedAction: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
