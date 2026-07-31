import { api } from './axios'
import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@/types/document'

export const documentsApi = {
  list: () => api.get<Document[]>('/documents').then((r) => r.data),
  reviewQueue: () => api.get<Document[]>('/documents/review-queue').then((r) => r.data),
  get: (id: string) => api.get<Document>(`/documents/${id}`).then((r) => r.data),
  search: (query: string) =>
    api.get<Document[]>('/documents/search', { params: { q: query } }).then((r) => r.data),
  create: (input: CreateDocumentInput) =>
    api.post<Document>('/documents', input).then((r) => r.data),
  update: (id: string, input: UpdateDocumentInput) =>
    api.put<Document>(`/documents/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/documents/${id}`).then(() => undefined),
}
