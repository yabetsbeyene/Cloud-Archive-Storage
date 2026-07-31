import type { Document, DocumentStatus } from './document'

export interface Dashboard {
  view: 'ADMIN' | 'ARCHIVIST' | 'MANAGER' | 'DEPT_USER' | 'VIEWER'
  showCollectionTotals: boolean
  showAdministrationTotals: boolean
  totalDocuments: number
  totalUsers: number
  totalCategories: number
  totalDepartments: number
  documentsByStatus: Record<DocumentStatus, number>
  recentDocuments: Document[]
}
