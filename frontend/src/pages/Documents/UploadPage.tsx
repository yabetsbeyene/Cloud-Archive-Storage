import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LockKeyhole,
  UploadCloud,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { categoriesApi } from '@/api/categories.api'
import { departmentsApi } from '@/api/departments.api'
import { documentsApi } from '@/api/documents.api'
import { getApiErrorMessage } from '@/api/error-message'
import { versionsApi } from '@/api/versions.api'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { TextareaField } from '@/components/ui/TextareaField'
import { useAuth } from '@/features/auth/auth-context'
import type { Document } from '@/types/document'
import { formatFileSize } from '@/utils/format'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().max(10_000, 'Description is too long').optional(),
  categoryId: z.string().min(1, 'Choose a category'),
  departmentId: z.string().min(1, 'Choose a department'),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET']),
})

type FormValues = z.infer<typeof schema>

class InitialUploadError extends Error {
  document: Document
  uploadError: unknown

  constructor(document: Document, uploadError: unknown) {
    super('The document was created, but its file could not be uploaded.')
    this.document = document
    this.uploadError = uploadError
  }
}

export function UploadPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [partialDocument, setPartialDocument] = useState<Document | null>(null)

  const canCreate =
    hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('DEPT_USER')

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
    enabled: canCreate,
  })
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
    enabled: canCreate,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      departmentId: '',
      classification: 'INTERNAL',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!file) throw new Error('Choose a file to upload')
      setUploadProgress(0)

      const document =
        partialDocument ??
        (await documentsApi.create({
          title: values.title,
          description: values.description || undefined,
          categoryId: values.categoryId,
          departmentId: values.departmentId,
          classification: values.classification,
        }))

      try {
        await versionsApi.upload(document.documentId, file, setUploadProgress)
      } catch (error) {
        throw new InitialUploadError(document, error)
      }

      return document
    },
    onSuccess: async (document) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      navigate('/documents', { replace: true, state: { createdTitle: document.title } })
    },
    onError: (error) => {
      if (error instanceof InitialUploadError) {
        setPartialDocument(error.document)
      }
    },
  })

  function selectFile(selected: File | undefined) {
    if (!selected) return
    if (selected.size === 0) {
      setFile(null)
      setFileError('The selected file is empty.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('The file must be 50 MB or smaller.')
      return
    }
    setFile(selected)
    setFileError(null)
    createMutation.reset()
  }

  function onSubmit(values: FormValues) {
    if (!file) {
      setFileError('Choose the first file version.')
      return
    }
    createMutation.mutate(values)
  }

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          to="/documents"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to documents
        </Link>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <LockKeyhole size={28} className="mx-auto text-slate-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Creation access required</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your current role can view archive records but cannot create new documents.
          </p>
        </div>
      </div>
    )
  }

  const referencesLoading = categoriesQuery.isLoading || departmentsQuery.isLoading
  const referencesFailed = categoriesQuery.isError || departmentsQuery.isError
  const referencesEmpty =
    !referencesLoading &&
    ((categoriesQuery.data?.length ?? 0) === 0 || (departmentsQuery.data?.length ?? 0) === 0)
  const mutationError =
    createMutation.error instanceof InitialUploadError
      ? getApiErrorMessage(
          createMutation.error.uploadError,
          'The file upload failed. Choose the file again or retry.',
        )
      : getApiErrorMessage(
          createMutation.error,
          'The document could not be created. Check the form and try again.',
        )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        to="/documents"
        className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-slate-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to documents
      </Link>

      <PageHeader
        title="Create document"
        description="Add the record’s metadata and its first file version in one guided flow."
      />

      {referencesFailed && (
        <div className="mt-6">
          <ErrorMessage message="Categories or departments could not be loaded. Refresh the page and try again." />
        </div>
      )}

      {referencesEmpty && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          At least one active category and department are required before a document can be created.
        </div>
      )}

      {createMutation.isError && (
        <div className="mt-6">
          <ErrorMessage message={mutationError} />
        </div>
      )}

      {partialDocument && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">The metadata was saved.</span> Retry the file upload below;
          the existing document will be reused and no duplicate will be created.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
              <FileText size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Record metadata</h2>
              <p className="text-xs text-slate-500">Fields marked required must be completed.</p>
            </div>
          </div>

          <fieldset disabled={partialDocument !== null || createMutation.isPending} className="mt-5 space-y-5 disabled:opacity-70">
            <Input
              label="Document title"
              placeholder="For example, Quarterly procurement report"
              autoComplete="off"
              {...register('title')}
              error={errors.title?.message}
            />

            <TextareaField
              label="Description"
              rows={4}
              placeholder="Add enough context for someone finding this record later."
              {...register('description')}
              error={errors.description?.message}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Category"
                {...register('categoryId')}
                error={errors.categoryId?.message}
              >
                <option value="">Select category</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Department"
                {...register('departmentId')}
                error={errors.departmentId?.message}
              >
                <option value="">Select department</option>
                {(departmentsQuery.data ?? []).map((department) => (
                  <option key={department.departmentId} value={department.departmentId}>
                    {department.name}
                  </option>
                ))}
              </SelectField>
            </div>

            <SelectField
              label="Classification"
              {...register('classification')}
              error={errors.classification?.message}
            >
              <option value="PUBLIC">Public — available to all authorized users</option>
              <option value="INTERNAL">Internal — standard organizational access</option>
              <option value="CONFIDENTIAL">Confidential — restricted business information</option>
              <option value="SECRET">Secret — highest access restriction</option>
            </SelectField>
          </fieldset>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <UploadCloud size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">First file version</h2>
                <p className="text-xs text-slate-500">Required · maximum 50 MB</p>
              </div>
            </div>

            {!file ? (
              <label
                className={`mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-4 py-9 text-center outline-none transition hover:border-indigo-400 hover:bg-indigo-50/40 focus-within:ring-2 focus-within:ring-indigo-500 ${
                  fileError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  selectFile(event.dataTransfer.files[0])
                }}
              >
                <UploadCloud size={26} className="text-indigo-600" aria-hidden="true" />
                <span className="mt-3 text-sm font-medium text-slate-800">Choose a file</span>
                <span className="mt-1 text-xs leading-5 text-slate-500">
                  or drag and drop it here
                </span>
                <input
                  type="file"
                  className="sr-only"
                  disabled={createMutation.isPending}
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              </label>
            ) : (
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  {!createMutation.isPending && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setFileError(null)
                        createMutation.reset()
                      }}
                      className="grid min-h-9 min-w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      aria-label="Remove selected file"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {createMutation.isPending && (
                  <div className="mt-4" role="status" aria-live="polite">
                    <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                      <span>{partialDocument ? 'Retrying upload' : 'Saving and uploading'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-[width]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {fileError && <p className="mt-2 text-xs text-rose-700">{fileError}</p>}

            <Button
              type="submit"
              className="mt-5 w-full"
              disabled={
                referencesLoading ||
                referencesFailed ||
                referencesEmpty ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <>
                  <UploadCloud size={17} aria-hidden="true" />
                  Uploading…
                </>
              ) : partialDocument ? (
                <>
                  <UploadCloud size={17} aria-hidden="true" />
                  Retry file upload
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Create and upload
                </>
              )}
            </Button>
          </section>

          <div className="px-1 text-xs leading-5 text-slate-500">
            {hasRole('ADMIN')
              ? 'Administrator-created records are archived automatically after creation.'
              : 'The record is submitted to the review queue immediately after a successful upload.'}
          </div>
        </aside>
      </form>
    </div>
  )
}
