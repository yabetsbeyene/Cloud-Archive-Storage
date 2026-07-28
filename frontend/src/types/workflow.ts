import type { DocumentStatus } from './document'

export interface DocumentWorkflowHistory {
  workflowId: string
  fromStatus: DocumentStatus | null
  toStatus: DocumentStatus
  comment: string | null
  changedAt: string
  changedBy: string
}

export interface TransitionInput {
  comment?: string
}