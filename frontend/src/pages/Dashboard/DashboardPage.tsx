import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FilePlus2, ListChecks, RotateCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '@/api/dashboard.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/Button'
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Dashboard } from '@/types/dashboard'
import type { DocumentStatus } from '@/types/document'
import { formatDate } from '@/utils/format'
import { documentStatusLabels } from '@/utils/document-status'

const workflowOrder: DocumentStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
]

const workflowBarStyles: Record<DocumentStatus, string> = {
  DRAFT: 'bg-slate-400',
  SUBMITTED: 'bg-blue-500',
  UNDER_REVIEW: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
  ARCHIVED: 'bg-violet-500',
}

const dashboardCopy: Record<
  Dashboard['view'],
  { title: string; description: string; recentTitle: string; recentDescription: string }
> = {
  ADMIN: {
    title: 'Administration overview',
    description: 'Monitor the archive, review workload, and system administration.',
    recentTitle: 'Recent collection activity',
    recentDescription: 'The latest records created across the system.',
  },
  ARCHIVIST: {
    title: 'Archive operations',
    description: 'Track the review queue and records ready for long-term preservation.',
    recentTitle: 'Recent archive activity',
    recentDescription: 'The latest records in your collection workflow.',
  },
  MANAGER: {
    title: 'Review workspace',
    description: 'Review submitted records and move approved work to the archivist.',
    recentTitle: 'Review queue activity',
    recentDescription: 'The latest records requiring review or archival action.',
  },
  DEPT_USER: {
    title: 'My document workspace',
    description: 'Follow your submitted records and respond when a review needs attention.',
    recentTitle: 'My recent documents',
    recentDescription: 'Only records that you created are shown here.',
  },
  VIEWER: {
    title: 'Archive access',
    description: 'Browse records that have completed the archival process.',
    recentTitle: 'Recently archived',
    recentDescription: 'The latest records available for viewing.',
  },
}

function getMetrics(dashboard: Dashboard): Array<[string, number]> {
  const status = dashboard.documentsByStatus

  switch (dashboard.view) {
    case 'ADMIN':
      return [
        ['Collection records', dashboard.totalDocuments],
        ['Awaiting review', (status.SUBMITTED ?? 0) + (status.UNDER_REVIEW ?? 0)],
        ['Active users', dashboard.totalUsers],
        ['Archived', status.ARCHIVED ?? 0],
      ]
    case 'ARCHIVIST':
      return [
        ['Collection records', dashboard.totalDocuments],
        ['Awaiting review', (status.SUBMITTED ?? 0) + (status.UNDER_REVIEW ?? 0)],
        ['Ready to archive', status.APPROVED ?? 0],
        ['Archived', status.ARCHIVED ?? 0],
      ]
    case 'MANAGER':
      return [
        ['Review queue', dashboard.totalDocuments],
        ['Submitted', status.SUBMITTED ?? 0],
        ['Under review', status.UNDER_REVIEW ?? 0],
        ['Approved', status.APPROVED ?? 0],
      ]
    case 'DEPT_USER':
      return [
        ['My documents', dashboard.totalDocuments],
        ['Submitted', status.SUBMITTED ?? 0],
        ['Under review', status.UNDER_REVIEW ?? 0],
        ['Needs attention', status.REJECTED ?? 0],
      ]
    default:
      return []
  }
}

export function DashboardPage() {
  const { hasRole } = useAuth()
  const canCreateDocument =
    hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('DEPT_USER')
  const canReview = hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('MANAGER')

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  const dashboard = dashboardQuery.data
  const copy = dashboard ? dashboardCopy[dashboard.view] : dashboardCopy.VIEWER
  const metrics = dashboard ? getMetrics(dashboard) : []

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          canCreateDocument || canReview ? (
            <div className="flex flex-wrap gap-2">
              {canReview && (
                <Link
                  to="/reviews"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <ListChecks size={17} aria-hidden="true" />
                  Review queue
                </Link>
              )}
              {canCreateDocument && (
                <Link
                  to="/documents/new"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <FilePlus2 size={17} aria-hidden="true" />
                  New document
                </Link>
              )}
            </div>
          ) : undefined
        }
      />

      {dashboardQuery.isLoading && <DashboardSkeleton />}

      {dashboardQuery.isError && (
        <div className="mt-6 space-y-3">
          <ErrorMessage
            message={getApiErrorMessage(
              dashboardQuery.error,
              'The dashboard could not be loaded. Check the connection and try again.',
            )}
          />
          <Button variant="secondary" onClick={() => dashboardQuery.refetch()}>
            <RotateCw size={16} aria-hidden="true" />
            Try again
          </Button>
        </div>
      )}

      {dashboard && (
        <>
          {metrics.length > 0 && (
            <section
              aria-label="Role dashboard totals"
              className="mt-6 grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4"
            >
              {metrics.map(([label, value], index) => (
                <div
                  key={label}
                  className={`px-5 py-5 ${index > 0 ? 'border-t border-slate-200 sm:border-l sm:border-t-0' : ''} ${
                    index === 2 ? 'sm:border-l-0 sm:border-t xl:border-l xl:border-t-0' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </section>
          )}

          <div
            className={`mt-6 grid gap-6 ${
              dashboard.view === 'VIEWER'
                ? ''
                : 'xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]'
            }`}
          >
            {dashboard.view !== 'VIEWER' && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-950">
                      Workflow pulse
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Counts are limited to the records available to your role.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {(dashboard.documentsByStatus.SUBMITTED ?? 0) +
                      (dashboard.documentsByStatus.UNDER_REVIEW ?? 0)}{' '}
                    awaiting action
                  </span>
                </div>

                {dashboard.totalDocuments === 0 ? (
                  <div className="mt-8 rounded-lg bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">No workflow activity yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Status counts will appear when records enter this workspace.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {workflowOrder.map((status) => {
                      const count = dashboard.documentsByStatus[status] ?? 0
                      const width = Math.max(
                        (count / dashboard.totalDocuments) * 100,
                        count > 0 ? 3 : 0,
                      )
                      return (
                        <div key={status}>
                          <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                            <span className="font-medium text-slate-700">
                              {documentStatusLabels[status]}
                            </span>
                            <span className="tabular-nums text-slate-500">{count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${workflowBarStyles[status]}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-950">
                    {copy.recentTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{copy.recentDescription}</p>
                </div>
                <Link
                  to={canReview ? '/reviews' : '/documents'}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-indigo-700 outline-none hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  View all
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              {dashboard.recentDocuments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">Nothing to show yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Recent records will appear here when they are available to your role.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dashboard.recentDocuments.map((document) => (
                    <Link
                      key={document.documentId}
                      to={`/documents/${document.documentId}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 outline-none transition hover:bg-slate-50 focus-visible:bg-indigo-50 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-indigo-700">
                          {document.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {document.referenceNumber || 'Reference pending'} ·{' '}
                          {document.department.name} · {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <DocumentStatusBadge status={document.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="mt-6 animate-pulse">
      <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="border-b border-slate-200 px-5 py-5 last:border-0 sm:border-r">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-9 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-96 rounded-xl bg-slate-200" />
        <div className="h-96 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}
