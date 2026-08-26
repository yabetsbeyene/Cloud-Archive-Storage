import type { DocumentStatus } from './document'

export interface DocumentWorkflowHistory {
  workflowId: string
  fromStatus: DocumentStatus | null
  toStatus: DocumentStatus
  comment: string | null
  amendmentSections: string | null
  amendmentComment: string | null
  rejectionReason: string | null
  changedAt: string
  changedBy: string
}

export interface TransitionInput {
  comment?: string
  amendmentSections?: string[]
  amendmentComment?: string
  classification?: import('./document').ClassificationLevel
}
