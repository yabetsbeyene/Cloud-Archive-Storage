import type { Category } from './category'
import type { Department } from './department'
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
  department: Department
  classification: ClassificationLevel
  status: DocumentStatus
  currentVersion: DocumentVersion | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  deletedAt: string | null
  deletedBy: string | null
}

export interface CreateDocumentInput {
  title: string
  description?: string
  categoryId: string
  departmentId: string
  classification?: ClassificationLevel
}

export interface UpdateDocumentInput {
  title?: string
  description?: string
  categoryId?: string
  classification?: ClassificationLevel
}