export interface DocumentVersion {
  versionId: string
  versionNumber: number
  originalFileName: string
  storedFileName: string
  filePath: string
  mimeType: string
  fileSize: number
  checksumSha256: string | null
  uploadedAt: string
  uploadedBy: string
}