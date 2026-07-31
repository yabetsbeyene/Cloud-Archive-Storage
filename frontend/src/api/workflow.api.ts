import { api } from './axios'
import type { Document } from '@/types/document'
import type { TransitionInput } from '@/types/workflow'
import type { DocumentWorkflowHistory } from '@/types/workflow'

export const workflowApi = {
  history: (documentId: string) =>
    api
      .get<DocumentWorkflowHistory[]>(`/documents/${documentId}/workflow/history`)
      .then((response) => response.data),
  submit: (documentId: string, input?: TransitionInput) =>
    api.post<Document>(`/documents/${documentId}/workflow/submit`, input ?? {}).then((r) => r.data),
  startReview: (documentId: string, input?: TransitionInput) =>
    api
      .post<Document>(`/documents/${documentId}/workflow/start-review`, input ?? {})
      .then((r) => r.data),
  approve: (documentId: string, input?: TransitionInput) =>
    api.post<Document>(`/documents/${documentId}/workflow/approve`, input ?? {}).then((r) => r.data),
  reject: (documentId: string, input: TransitionInput) =>
    api.post<Document>(`/documents/${documentId}/workflow/reject`, input).then((r) => r.data),
  archive: (documentId: string, input?: TransitionInput) =>
    api.post<Document>(`/documents/${documentId}/workflow/archive`, input ?? {}).then((r) => r.data),
}
