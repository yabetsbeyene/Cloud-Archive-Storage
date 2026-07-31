import { useState, type FormEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ClipboardList, FilterX, Search } from 'lucide-react'
import { auditLogsApi } from '@/api/audit-logs.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import type { AuditAction, AuditLog, ResourceType } from '@/types/auditLog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { formatDateTime } from '@/utils/format'

const resourceTypes: ResourceType[] = ['DOCUMENT', 'DOCUMENT_VERSION', 'USER', 'DEPARTMENT', 'CATEGORY']
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface AuditFilters {
  actorId: string
  resourceType: '' | ResourceType
  resourceId: string
}

const emptyFilters: AuditFilters = { actorId: '', resourceType: '', resourceId: '' }

export function AuditLogsPage() {
  const { hasRole } = useAuth()
  const canView = hasRole('ADMIN') || hasRole('ARCHIVIST')
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters)
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters)
  const [filterError, setFilterError] = useState('')

  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () =>
      auditLogsApi.list({
        page,
        size: 20,
        actorId: filters.actorId || undefined,
        resourceType: filters.resourceType || undefined,
        resourceId: filters.resourceId || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  })

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    if (draft.actorId && !uuidPattern.test(draft.actorId.trim())) {
      setFilterError('Actor ID must be a valid UUID.')
      return
    }
    if (draft.resourceId && !draft.resourceType) {
      setFilterError('Choose a resource type before entering a resource ID.')
      return
    }
    if (draft.resourceId && !uuidPattern.test(draft.resourceId.trim())) {
      setFilterError('Resource ID must be a valid UUID.')
      return
    }
    setFilterError('')
    setFilters({
      actorId: draft.actorId.trim(),
      resourceType: draft.resourceType,
      resourceId: draft.resourceId.trim(),
    })
    setPage(0)
  }

  function clearFilters() {
    setDraft(emptyFilters)
    setFilters(emptyFilters)
    setFilterError('')
    setPage(0)
  }

  const hasFilters = Boolean(filters.actorId || filters.resourceType || filters.resourceId)
  const result = logsQuery.data

  return (
    <div>
      <PageHeader
        title="Audit trail"
        description="Trace security-sensitive activity across documents, users, and archive configuration."
      />

      {!canView && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <ClipboardList className="mx-auto text-slate-400" size={30} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-950">Audit access is restricted</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">
            Only administrators and archivists can inspect the organization audit trail.
          </p>
        </section>
      )}

      {canView && (
        <>
          <form onSubmit={applyFilters} className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_1fr_auto] xl:items-end">
              <Input
                label="Actor UUID filter"
                value={draft.actorId}
                onChange={(event) => setDraft((current) => ({ ...current, actorId: event.target.value }))}
                placeholder="Filter by user UUID"
              />
              <SelectField
                label="Resource type"
                value={draft.resourceType}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    resourceType: event.target.value as '' | ResourceType,
                    resourceId: event.target.value ? current.resourceId : '',
                  }))
                }
              >
                <option value="">All resource types</option>
                {resourceTypes.map((type) => <option key={type} value={type}>{formatResourceType(type)}</option>)}
              </SelectField>
              <Input
                label="Resource ID"
                value={draft.resourceId}
                onChange={(event) => setDraft((current) => ({ ...current, resourceId: event.target.value }))}
                placeholder={draft.resourceType ? 'Filter by resource UUID' : 'Select a resource type first'}
                disabled={!draft.resourceType}
              />
              <Button type="submit">
                <Search size={16} aria-hidden="true" />
                Apply filters
              </Button>
            </div>
            <div className="mt-3 flex min-h-6 items-center justify-between gap-4">
              <p role={filterError ? 'alert' : undefined} className={`text-xs ${filterError ? 'text-rose-700' : 'text-slate-500'}`}>
                {filterError || 'Actor filtering takes priority when combined with resource filters.'}
              </p>
              {(hasFilters || draft.actorId || draft.resourceType || draft.resourceId) && (
                <button type="button" onClick={clearFilters} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500">
                  <FilterX size={15} aria-hidden="true" /> Clear
                </button>
              )}
            </div>
          </form>

          {logsQuery.isLoading && <AuditSkeleton />}
          {logsQuery.isError && (
            <div role="alert" className="mt-4 flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{getApiErrorMessage(logsQuery.error, 'Audit events could not be loaded.')}</span>
              <Button variant="secondary" className="min-h-9 bg-white px-3" onClick={() => logsQuery.refetch()}>Try again</Button>
            </div>
          )}
          {result && result.content.length === 0 && (
            <section className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <ClipboardList className="mx-auto text-slate-400" size={28} aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-slate-950">{hasFilters ? 'No events match these filters' : 'No audit events yet'}</h2>
              <p className="mt-1 text-sm text-slate-600">{hasFilters ? 'Clear or adjust the filters and try again.' : 'Recorded archive activity will appear here.'}</p>
            </section>
          )}
          {result && result.content.length > 0 && (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                    <tr>
                      <th className="w-[15%] px-4 py-3 font-medium">Timestamp</th>
                      <th className="w-[10%] px-4 py-3 font-medium">Action</th>
                      <th className="w-[27%] px-4 py-3 font-medium">Resource</th>
                      <th className="w-[23%] px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.content.map((log) => <AuditRow key={log.auditLogId} log={log} />)}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3 lg:hidden">
                {result.content.map((log) => <AuditCard key={log.auditLogId} log={log} />)}
              </div>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                totalElements={result.totalElements}
                size={result.size}
                isFetching={logsQuery.isFetching}
                onPage={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

function AuditRow({ log }: { log: AuditLog }) {
  return (
    <tr>
      <td className="px-4 py-4 text-slate-600">{formatDateTime(log.createdAt)}</td>
      <td className="px-4 py-4"><ActionBadge action={log.action} /></td>
      <td className="px-4 py-4">
        <p className="font-medium text-slate-900">{log.resource.label}</p>
        <p className="mt-1 text-xs text-slate-500">{formatResourceType(log.resourceType)}</p>
        {(log.resource.category || log.resource.department) && (
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {[log.resource.category && `Category: ${log.resource.category}`, log.resource.department && `Department: ${log.resource.department}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </td>
      <td className="px-4 py-4">
        {log.actor ? (
          <>
            <p className="font-medium text-slate-900">{log.actor.fullName}</p>
            <p className="mt-1 break-all text-xs text-slate-600">{log.actor.email}</p>
            {log.actor.department && <p className="mt-1 text-xs text-slate-500">{log.actor.department.name}</p>}
          </>
        ) : (
          <p className="text-sm text-slate-600">System process</p>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="font-medium text-slate-900">{log.performedAction}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{log.details || 'No additional context recorded.'}</p>
      </td>
    </tr>
  )
}

function AuditCard({ log }: { log: AuditLog }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-950">{log.resource.label}</p>
          <p className="mt-1 text-xs text-slate-500">{formatResourceType(log.resourceType)} · {formatDateTime(log.createdAt)}</p>
        </div>
        <ActionBadge action={log.action} />
      </div>
      {(log.resource.category || log.resource.department) && (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          {[log.resource.category && `Category: ${log.resource.category}`, log.resource.department && `Department: ${log.resource.department}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      <dl className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Actor</dt>
          <dd className="mt-1 text-slate-800">
            {log.actor ? (
              <>
                <p className="font-medium">{log.actor.fullName}</p>
                <p className="mt-0.5 break-all text-xs text-slate-600">{log.actor.email}</p>
                {log.actor.department && <p className="mt-0.5 text-xs text-slate-500">{log.actor.department.name}</p>}
              </>
            ) : 'System process'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Performed</dt>
          <dd className="mt-1 text-slate-800">
            <p className="font-medium">{log.performedAction}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{log.details || 'No additional context recorded.'}</p>
          </dd>
        </div>
      </dl>
    </article>
  )
}

function ActionBadge({ action }: { action: AuditAction }) {
  const label = action.charAt(0) + action.slice(1).toLowerCase()
  const className =
    action === 'DELETE' || action === 'REJECT'
      ? 'bg-rose-50 text-rose-700'
      : action === 'CREATE' || action === 'APPROVE' || action === 'RESTORE'
        ? 'bg-emerald-50 text-emerald-700'
        : action === 'UPDATE' || action === 'UPLOAD' || action === 'ARCHIVE'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>
}

function Pagination({ page, totalPages, totalElements, size, isFetching, onPage }: { page: number; totalPages: number; totalElements: number; size: number; isFetching: boolean; onPage: (page: number) => void }) {
  const first = page * size + 1
  const last = Math.min((page + 1) * size, totalElements)
  return (
    <nav aria-label="Audit log pages" className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">Showing {first}–{last} of {totalElements} events{isFetching ? ' · Updating…' : ''}</p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Button variant="secondary" className="min-h-10 px-3" disabled={page === 0 || isFetching} onClick={() => onPage(page - 1)}><ChevronLeft size={16} aria-hidden="true" /> Previous</Button>
        <span className="text-sm font-medium text-slate-700">Page {page + 1} of {totalPages}</span>
        <Button variant="secondary" className="min-h-10 px-3" disabled={page + 1 >= totalPages || isFetching} onClick={() => onPage(page + 1)}>Next <ChevronRight size={16} aria-hidden="true" /></Button>
      </div>
    </nav>
  )
}

function formatResourceType(type: ResourceType) {
  return type.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' ')
}

function AuditSkeleton() {
  return <div role="status" aria-label="Loading audit events" className="mt-4 animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-6 border-b border-slate-100 px-4 last:border-0"><div className="h-4 w-28 rounded bg-slate-100" /><div className="h-6 w-16 rounded-full bg-slate-100" /><div className="h-4 w-36 rounded bg-slate-100" /><div className="h-4 flex-1 rounded bg-slate-100" /></div>)}</div>
}
