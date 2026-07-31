import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, RotateCw } from 'lucide-react'
import { documentsApi } from '@/api/documents.api'
import { getApiErrorMessage } from '@/api/error-message'
import { DocumentWorkflowActions } from '@/components/documents/DocumentWorkflowActions'
import { Button } from '@/components/ui/Button'
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import type { DocumentStatus } from '@/types/document'
import { formatDate } from '@/utils/format'

type QueueStatus = 'ALL' | Extract<DocumentStatus, 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED'>

export function ReviewQueuePage() {
  const [status, setStatus] = useState<QueueStatus>('ALL')
  const queueQuery = useQuery({
    queryKey: ['review-queue'],
    queryFn: documentsApi.reviewQueue,
  })
  const documents = useMemo(
    () => (queueQuery.data ?? []).filter((document) => status === 'ALL' || document.status === status),
    [queueQuery.data, status],
  )
  const count = (target: QueueStatus) =>
    target === 'ALL'
      ? queueQuery.data?.length ?? 0
      : queueQuery.data?.filter((document) => document.status === target).length ?? 0

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Review queue"
        description="Inspect submitted metadata, make a review decision, and move approved records into the archive."
      />

      <div className="mt-6 flex flex-wrap gap-x-2 border-b border-slate-200 sm:flex-nowrap" role="tablist" aria-label="Review status">
        {([
          ['ALL', 'All pending'],
          ['SUBMITTED', 'Submitted'],
          ['UNDER_REVIEW', 'Under review'],
          ['APPROVED', 'Ready to archive'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={status === value}
            onClick={() => setStatus(value)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium outline-none ${
              status === value
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            {label} <span className="ml-1 text-xs tabular-nums">({count(value)})</span>
          </button>
        ))}
      </div>

      {queueQuery.isLoading && <QueueSkeleton />}
      {queueQuery.isError && (
        <div className="mt-5 space-y-3">
          <ErrorMessage message={getApiErrorMessage(queueQuery.error, 'The review queue could not be loaded.')} />
          <Button variant="secondary" onClick={() => queueQuery.refetch()}>
            <RotateCw size={16} aria-hidden="true" /> Try again
          </Button>
        </div>
      )}
      {!queueQuery.isLoading && !queueQuery.isError && documents.length === 0 && (
        <section className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ClipboardCheck className="mx-auto text-slate-400" size={30} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-950">Nothing waiting here</h2>
          <p className="mt-1 text-sm text-slate-600">
            {status === 'ALL' ? 'The review queue is clear.' : 'No documents currently have this status.'}
          </p>
        </section>
      )}
      {documents.length > 0 && (
        <div className="mt-5 space-y-3">
          {documents.map((document) => (
            <article key={document.documentId} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <DocumentStatusBadge status={document.status} />
                    <span className="text-xs text-slate-500">{document.classification}</span>
                  </div>
                  <h2 className="mt-2 truncate text-base font-semibold text-slate-950">{document.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {document.referenceNumber || 'Reference pending'} · {document.category.name} · {document.department.name}
                  </p>
                <p className="mt-1 text-xs text-slate-500">
                  Submitted {formatDate(document.createdAt)} · {document.currentVersion ? `Version ${document.currentVersion.versionNumber}` : 'No file version'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Uploaded by {document.uploadedBy?.fullName || 'Unknown user'} ·{' '}
                  {document.uploadedBy?.department?.name || 'No assigned department'}
                </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <DocumentWorkflowActions document={document} compact />
                  <Link to={`/documents/${document.documentId}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500">
                    Inspect metadata <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div role="status" aria-label="Loading review queue" className="mt-5 space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white p-5">
          <div className="h-5 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-5 w-72 max-w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
