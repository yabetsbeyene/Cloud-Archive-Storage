import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Eye, FileText, History, RotateCw, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { documentsApi } from '@/api/documents.api'
import { versionsApi } from '@/api/versions.api'
import { workflowApi } from '@/api/workflow.api'
import { getApiErrorMessage } from '@/api/error-message'
import { DocumentWorkflowActions } from '@/components/documents/DocumentWorkflowActions'
import { Button } from '@/components/ui/Button'
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Modal } from '@/components/ui/Modal'
import { formatDateTime, formatFileSize } from '@/utils/format'
import { documentStatusLabels } from '@/utils/document-status'

interface PreviewState {
  versionId: string
  fileName: string
  mimeType: string
  url: string
}

export function DocumentDetailPage() {
  const { id = '' } = useParams()
  const [downloadError, setDownloadError] = useState('')
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)
  const documentQuery = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id),
    enabled: Boolean(id),
  })
  const versionsQuery = useQuery({
    queryKey: ['versions', id],
    queryFn: () => versionsApi.list(id),
    enabled: Boolean(id),
  })
  const historyQuery = useQuery({
    queryKey: ['workflow-history', id],
    queryFn: () => workflowApi.history(id),
    enabled: Boolean(id),
  })

  useEffect(() => {
    return () => {
      if (preview) window.URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  if (documentQuery.isLoading) {
    return <DetailSkeleton />
  }
  if (documentQuery.isError || !documentQuery.data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <ErrorMessage message={getApiErrorMessage(documentQuery.error, 'The document metadata could not be loaded.')} />
        <Button variant="secondary" onClick={() => documentQuery.refetch()}>
          <RotateCw size={16} aria-hidden="true" /> Try again
        </Button>
      </div>
    )
  }

  const document = documentQuery.data

  async function download(versionId: string, fileName: string) {
    try {
      setDownloadError('')
      await versionsApi.download(id, versionId, fileName)
    } catch (error) {
      setDownloadError(getApiErrorMessage(error, 'The file could not be downloaded.'))
    }
  }

  async function openPreview(versionId: string, fileName: string) {
    try {
      setDownloadError('')
      setPreviewLoadingId(versionId)
      const result = await versionsApi.preview(id, versionId)
      setPreview({ versionId, fileName, mimeType: result.mimeType, url: result.url })
    } catch (error) {
      setDownloadError(getApiErrorMessage(error, 'The document preview could not be opened.'))
    } finally {
      setPreviewLoadingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link to="/documents" className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-slate-700 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500">
        <ArrowLeft size={16} aria-hidden="true" /> Back to documents
      </Link>

      <header className="mt-4 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DocumentStatusBadge status={document.status} />
            <span className="text-sm text-slate-500">{document.referenceNumber || 'Reference pending'}</span>
          </div>
          <h1 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-3xl">{document.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{document.description || 'No description was provided.'}</p>
        </div>
        <div className="shrink-0">
          <DocumentWorkflowActions document={document} />
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <FileText size={18} className="text-indigo-600" aria-hidden="true" />
              <div><h2 className="font-semibold text-slate-950">Record metadata</h2><p className="mt-0.5 text-xs text-slate-500">The classification and ownership details used during review.</p></div>
            </div>
            <div className="flex items-start gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <UserRound size={18} className="mt-0.5 shrink-0 text-indigo-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Originally uploaded by</p>
                {document.uploadedBy ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {document.uploadedBy.fullName}
                      <span className="font-normal text-slate-500"> · @{document.uploadedBy.username}</span>
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-600">
                      {document.uploadedBy.email} ·{' '}
                      {document.uploadedBy.department?.name || 'No department assigned'}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">Uploader profile unavailable</p>
                )}
              </div>
            </div>
            <dl className="grid sm:grid-cols-2">
              <Metadata label="Category" value={document.category.name} />
              <Metadata label="Department" value={document.department.name} />
              <Metadata label="Classification" value={document.classification} />
              <Metadata label="Reference" value={document.referenceNumber || 'Pending'} />
              <Metadata label="Created" value={formatDateTime(document.createdAt)} />
              <Metadata label="Last updated" value={formatDateTime(document.updatedAt)} />
              {document.archivedAt && <Metadata label="Archived" value={formatDateTime(document.archivedAt)} />}
            </dl>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">File versions</h2>
              <p className="mt-0.5 text-xs text-slate-500">Review the exact file attached to this record.</p>
            </div>
            {downloadError && <p role="alert" className="m-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{downloadError}</p>}
            {versionsQuery.isLoading && <p className="px-5 py-8 text-sm text-slate-500">Loading file versions…</p>}
            {versionsQuery.isError && <p className="px-5 py-8 text-sm text-rose-700">File versions could not be loaded.</p>}
            {versionsQuery.data?.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">No file version has been uploaded.</p>}
            <div className="divide-y divide-slate-100">
              {versionsQuery.data?.map((version) => (
                <div key={version.versionId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">Version {version.versionNumber} · {version.originalFileName}</p><p className="mt-1 text-xs text-slate-500">{formatFileSize(version.fileSize)} · {formatDateTime(version.uploadedAt)}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="min-h-10 px-3"
                      onClick={() => openPreview(version.versionId, version.originalFileName)}
                      disabled={!isPreviewable(version.mimeType) || previewLoadingId === version.versionId}
                      title={isPreviewable(version.mimeType) ? 'Open this file in the archive' : 'Preview is available for PDF, image, and plain-text files'}
                    >
                      <Eye size={15} aria-hidden="true" />
                      {previewLoadingId === version.versionId ? 'Openingâ€¦' : 'Open'}
                    </Button>
                    <Button variant="secondary" className="min-h-10 px-3" onClick={() => download(version.versionId, version.originalFileName)}>
                      <Download size={15} aria-hidden="true" /> Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="self-start overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <History size={18} className="text-indigo-600" aria-hidden="true" />
            <div><h2 className="font-semibold text-slate-950">Workflow history</h2><p className="mt-0.5 text-xs text-slate-500">Every status decision is recorded.</p></div>
          </div>
          {historyQuery.isLoading && <p className="px-5 py-8 text-sm text-slate-500">Loading workflow history…</p>}
          {historyQuery.isError && <p className="px-5 py-8 text-sm text-rose-700">Workflow history could not be loaded.</p>}
          {historyQuery.data?.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">No workflow changes recorded yet.</p>}
          <ol className="divide-y divide-slate-100">
            {historyQuery.data?.map((event) => (
              <li key={event.workflowId} className="px-5 py-4">
                <p className="text-sm font-medium text-slate-900">{event.fromStatus ? `${documentStatusLabels[event.fromStatus]} → ` : ''}{documentStatusLabels[event.toStatus]}</p>
                {event.comment && <p className="mt-1 text-sm leading-5 text-slate-600">{event.comment}</p>}
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.changedAt)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Modal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        title="Document preview"
        size="xl"
      >
        {preview && (
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-900">{preview.fileName}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  You are viewing the secured archive copy. Opening this version is recorded in the
                  audit log.
                </p>
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => download(preview.versionId, preview.fileName)}
              >
                <Download size={16} aria-hidden="true" /> Download
              </Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {preview.mimeType.startsWith('image/') ? (
                <div className="grid min-h-[55svh] place-items-center p-4">
                  <img
                    src={preview.url}
                    alt={`Preview of ${preview.fileName}`}
                    className="max-h-[70svh] max-w-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={preview.url}
                  title={`Preview of ${preview.fileName}`}
                  className="h-[70svh] w-full bg-white"
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function isPreviewable(mimeType: string) {
  const normalized = mimeType.split(';', 1)[0].trim().toLowerCase()
  return normalized === 'application/pdf'
    || normalized === 'text/plain'
    || normalized === 'text/csv'
    || ['image/gif', 'image/jpeg', 'image/png', 'image/webp'].includes(normalized)
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-slate-100 px-5 py-4 first:border-t-0 sm:even:border-l sm:[&:nth-child(2)]:border-t-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function DetailSkeleton() {
  return <div role="status" aria-label="Loading document detail" className="mx-auto max-w-6xl animate-pulse"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mt-8 h-9 w-96 max-w-full rounded bg-slate-200" /><div className="mt-8 grid gap-6 lg:grid-cols-3"><div className="h-96 rounded-xl bg-slate-200 lg:col-span-2" /><div className="h-96 rounded-xl bg-slate-200" /></div></div>
}
