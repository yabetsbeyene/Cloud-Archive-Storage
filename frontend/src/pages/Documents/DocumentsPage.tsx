import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import { departmentsApi } from '@/api/departments.api'
import { documentsApi } from '@/api/documents.api'
import { getApiErrorMessage } from '@/api/error-message'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DocumentStatusBadge } from '@/components/ui/DocumentStatusBadge'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { useAuth } from '@/features/auth/auth-context'
import type {
  ClassificationLevel,
  Document,
  DocumentStatus,
} from '@/types/document'
import { formatDate } from '@/utils/format'
import { documentStatusLabels } from '@/utils/document-status'

const PAGE_SIZE = 10

const classifications: ClassificationLevel[] = [
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'SECRET',
]

const classificationStyles: Record<ClassificationLevel, string> = {
  PUBLIC: 'text-emerald-700',
  INTERNAL: 'text-slate-600',
  CONFIDENTIAL: 'text-amber-700',
  SECRET: 'text-rose-700',
}

interface DocumentsLocationState {
  createdTitle?: string
}

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const { hasRole } = useAuth()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const [status, setStatus] = useState<DocumentStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [classification, setClassification] = useState<ClassificationLevel | ''>('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Document | null>(null)

  const canCreate =
    hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('DEPT_USER')
  const canDelete = hasRole('ADMIN') || hasRole('ARCHIVIST')
  const createdTitle = (location.state as DocumentsLocationState | null)?.createdTitle

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleting(null)
    },
  })

  const filteredDocuments = useMemo(() => {
    return [...(documentsQuery.data ?? [])]
      .filter((document) => {
        const searchable = [
          document.title,
          document.referenceNumber,
          document.description,
          document.category.name,
          document.department.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return (
          (!deferredQuery || searchable.includes(deferredQuery)) &&
          (!status || document.status === status) &&
          (!categoryId || document.category.categoryId === categoryId) &&
          (!departmentId || document.department.departmentId === departmentId) &&
          (!classification || document.classification === classification)
        )
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  }, [
    documentsQuery.data,
    deferredQuery,
    status,
    categoryId,
    departmentId,
    classification,
  ])

  const totalPages = Math.max(Math.ceil(filteredDocuments.length / PAGE_SIZE), 1)
  const visibleDocuments = filteredDocuments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = Boolean(query || status || categoryId || departmentId || classification)

  useEffect(() => {
    setPage(1)
  }, [deferredQuery, status, categoryId, departmentId, classification])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function clearFilters() {
    setQuery('')
    setStatus('')
    setCategoryId('')
    setDepartmentId('')
    setClassification('')
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Documents"
        description="Find, filter, and manage records throughout their lifecycle."
        action={
          canCreate ? (
            <Link
              to="/documents/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <FilePlus2 size={17} aria-hidden="true" />
              New document
            </Link>
          ) : undefined
        }
      />

      {createdTitle && (
        <div
          role="status"
          className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span className="font-medium">“{createdTitle}” is now in the archive.</span>{' '}
          Its first file version was uploaded successfully.
        </div>
      )}

      <section aria-label="Document filters" className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.5fr)_repeat(4,minmax(9rem,1fr))]">
          <div className="relative">
            <label htmlFor="document-search" className="sr-only">
              Search documents
            </label>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="document-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, reference, category…"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <SelectField
            label="Status"
            hideLabel
            value={status}
            onChange={(event) => setStatus(event.target.value as DocumentStatus | '')}
          >
            <option value="">All statuses</option>
            {Object.entries(documentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Category"
            hideLabel
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All categories</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Department"
            hideLabel
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">All departments</option>
            {(departmentsQuery.data ?? []).map((department) => (
              <option key={department.departmentId} value={department.departmentId}>
                {department.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Classification"
            hideLabel
            value={classification}
            onChange={(event) =>
              setClassification(event.target.value as ClassificationLevel | '')
            }
          >
            <option value="">All classifications</option>
            {classifications.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-3 flex min-h-6 items-center justify-between gap-4">
          <p className="text-xs text-slate-500" aria-live="polite">
            {documentsQuery.isLoading
              ? 'Loading documents…'
              : `${filteredDocuments.length} ${
                  filteredDocuments.length === 1 ? 'document' : 'documents'
                } found`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-700"
            >
              <X size={14} aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      </section>

      {documentsQuery.isLoading && <DocumentsSkeleton />}

      {documentsQuery.isError && (
        <div className="mt-5">
          <ErrorMessage
            message={getApiErrorMessage(
              documentsQuery.error,
              'Documents could not be loaded. Check the connection and try again.',
            )}
          />
        </div>
      )}

      {deleteMutation.isError && (
        <div className="mt-5">
          <ErrorMessage
            message={getApiErrorMessage(
              deleteMutation.error,
              'The document could not be deleted. Try again.',
            )}
          />
        </div>
      )}

      {!documentsQuery.isLoading &&
        !documentsQuery.isError &&
        documentsQuery.data &&
        visibleDocuments.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-base font-medium text-slate-800">
              {hasFilters ? 'No documents match these filters' : 'No documents yet'}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {hasFilters
                ? 'Adjust or clear the filters to broaden the results.'
                : 'Create the first record to start building the archive.'}
            </p>
            {hasFilters ? (
              <Button variant="secondary" className="mt-5" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Link
                to="/documents/new"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <FilePlus2 size={17} aria-hidden="true" />
                Create first document
              </Link>
            ) : null}
          </div>
        )}

      {visibleDocuments.length > 0 && (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="w-[35%] px-5 py-3">Document</th>
                  <th className="w-[15%] px-4 py-3">Status</th>
                  <th className="w-[18%] px-4 py-3">Department</th>
                  <th className="w-[14%] px-4 py-3">Classification</th>
                  <th className="w-[18%] px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleDocuments.map((document) => (
                  <tr key={document.documentId} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <Link
                        to={`/documents/${document.documentId}`}
                        className="block min-w-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <span className="block truncate font-medium text-slate-900 hover:text-indigo-700">
                          {document.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {document.referenceNumber || 'Reference pending'} · {document.category.name} ·{' '}
                          {formatDate(document.createdAt)}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          Uploaded by {document.uploadedBy?.fullName || 'Unknown user'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <DocumentStatusBadge status={document.status} />
                    </td>
                    <td className="truncate px-4 py-4 text-slate-600">
                      {document.department.name}
                    </td>
                    <td className={`px-4 py-4 text-xs font-medium ${classificationStyles[document.classification]}`}>
                      {formatEnumLabel(document.classification)}
                    </td>
                    <td className="px-5 py-4">
                      <DocumentActions
                        document={document}
                        canEdit={canCreate}
                        canDelete={canDelete}
                        onDelete={() => setDeleting(document)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-3 md:hidden">
            {visibleDocuments.map((document) => (
              <article key={document.documentId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/documents/${document.documentId}`}
                      className="font-medium text-slate-900 hover:text-indigo-700"
                    >
                      {document.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {document.referenceNumber || 'Reference pending'}
                    </p>
                  </div>
                  <DocumentStatusBadge status={document.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Department</dt>
                    <dd className="mt-1 font-medium text-slate-700">{document.department.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Classification</dt>
                    <dd className={`mt-1 font-medium ${classificationStyles[document.classification]}`}>
                      {formatEnumLabel(document.classification)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Originally uploaded by</dt>
                    <dd className="mt-1 font-medium text-slate-700">
                      {document.uploadedBy?.fullName || 'Unknown user'} ·{' '}
                      {document.uploadedBy?.department?.name || 'No assigned department'}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-slate-100 pt-2">
                  <DocumentActions
                    document={document}
                    canEdit={canCreate}
                    canDelete={canDelete}
                    onDelete={() => setDeleting(document)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="px-3"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
              <span className="min-w-20 text-center text-xs font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                className="px-3"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete document"
        message={`Delete “${deleting?.title}”? The record will be removed from normal archive views.`}
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.documentId)}
      />
    </div>
  )
}

function DocumentActions({
  document,
  canEdit,
  canDelete,
  onDelete,
}: {
  document: Document
  canEdit: boolean
  canDelete: boolean
  onDelete: () => void
}) {
  const isEditable = document.status === 'DRAFT' || document.status === 'REJECTED'

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/documents/${document.documentId}`}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`View ${document.title}`}
      >
        <Eye size={17} aria-hidden="true" />
      </Link>
      {canEdit && isEditable && (
        <Link
          to={`/documents/${document.documentId}/edit`}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 outline-none hover:bg-slate-100 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Edit ${document.title}`}
        >
          <Pencil size={16} aria-hidden="true" />
        </Link>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-rose-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label={`Delete ${document.title}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function DocumentsSkeleton() {
  return (
    <div role="status" aria-label="Loading documents" className="mt-5 animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-11 border-b border-slate-200 bg-slate-100" />
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center gap-8 border-b border-slate-100 px-5 py-5 last:border-0">
          <div className="flex-1">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-64 max-w-full rounded bg-slate-100" />
          </div>
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="hidden h-4 w-28 rounded bg-slate-100 md:block" />
        </div>
      ))}
    </div>
  )
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
