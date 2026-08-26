import type { Category } from './category'
import type { Department, DepartmentSummary } from './department'
import type { DocumentVersion } from './documentVersion'

export type ClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET'

export type DocumentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED'

export interface Document {
  documentId: string
  referenceNumber: string | null
  title: string
  description: string | null
  category: Category
  department: Department | null
  otherDepartmentName: string | null
  classification: ClassificationLevel
  status: DocumentStatus
  currentVersion: DocumentVersion | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  uploadedBy: {
    username: string
    fullName: string
    email: string
    department: DepartmentSummary | null
  } | null
  createdBy: string | null
  updatedBy: string | null
}

export interface CreateDocumentInput {
  title: string
  description?: string
  categoryId: string
  departmentId?: string
  otherDepartmentName?: string
  classification?: ClassificationLevel
}

export interface UpdateDocumentInput {
  title?: string
  description?: string
  categoryId?: string
  departmentId?: string
  otherDepartmentName?: string
  classification?: ClassificationLevel
}
