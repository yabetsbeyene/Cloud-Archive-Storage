import { api } from './axios'
import type { DocumentVersion } from '@/types/documentVersion'

export const versionsApi = {
  list: (documentId: string) =>
    api.get<DocumentVersion[]>(`/documents/${documentId}/versions`).then((r) => r.data),

  upload: (documentId: string, file: File, onProgress?: (percentage: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<DocumentVersion>(`/documents/${documentId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total && onProgress) {
            onProgress(Math.round((event.loaded / event.total) * 100))
          }
        },
      })
      .then((r) => r.data)
  },

  // Downloads as a Blob so the browser can save it with the real filename,
  // rather than navigating the page to the file URL directly.
  download: async (documentId: string, versionId: string, fileName: string) => {
    const response = await api.get(`/documents/${documentId}/versions/${versionId}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
