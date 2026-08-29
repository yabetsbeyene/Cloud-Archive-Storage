import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { accountApi } from '@/api/account.api'
import { categoriesApi } from '@/api/categories.api'
import { departmentsApi } from '@/api/departments.api'
import { documentsApi } from '@/api/documents.api'
import { getApiErrorMessage } from '@/api/error-message'
import { versionsApi } from '@/api/versions.api'
import { workflowApi } from '@/api/workflow.api'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { TextareaField } from '@/components/ui/TextareaField'
import { useAuth } from '@/features/auth/auth-context'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().max(10_000, 'Description is too long').optional(),
  categoryId: z.string().min(1, 'Choose a category'),
  departmentId: z.string().min(1, 'Choose a department'),
  otherDepartmentName: z.string().trim().max(150, 'Department name is too long').optional(),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET']),
}).superRefine((values, context) => {
  if (values.departmentId === '__OTHER__' && !values.otherDepartmentName) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['otherDepartmentName'], message: 'Type the department name' })
  }
})
type FormValues = z.infer<typeof schema>

export function DocumentEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canUseOther = hasRole('ADMIN') || hasRole('ARCHIVIST')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  const documentQuery = useQuery({ queryKey: ['document', id], queryFn: () => documentsApi.get(id), enabled: Boolean(id) })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list })
  const accountQuery = useQuery({ queryKey: ['account'], queryFn: accountApi.get, enabled: hasRole('DEPT_USER') })
  const historyQuery = useQuery({ queryKey: ['workflow-history', id], queryFn: () => workflowApi.history(id), enabled: Boolean(id) })
  const document = documentQuery.data
  const feedback = historyQuery.data?.find((event) =>
    event.comment || event.amendmentComment || event.rejectionReason,
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: document ? {
      title: document.title,
      description: document.description ?? '',
      categoryId: document.category.categoryId,
      departmentId: document.department?.departmentId ?? '__OTHER__',
      otherDepartmentName: document.otherDepartmentName ?? '',
      classification: document.classification,
    } : undefined,
  })

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (document?.status === 'REJECTED') await workflowApi.beginEdit(id)
      const updated = await documentsApi.update(id, {
        title: values.title.trim(),
        description: values.description,
        categoryId: values.categoryId,
        departmentId: values.departmentId === '__OTHER__' ? undefined : values.departmentId,
        otherDepartmentName: values.departmentId === '__OTHER__' ? values.otherDepartmentName : undefined,
        classification: hasRole('ARCHIVIST') ? values.classification : undefined,
      })
      if (file) await versionsApi.upload(id, file)
      await workflowApi.submit(id)
      return updated
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['document', id] }),
        queryClient.invalidateQueries({ queryKey: ['versions', id] }),
        queryClient.invalidateQueries({ queryKey: ['workflow-history', id] }),
      ])
      navigate(`/documents/${id}`, { replace: true })
    },
  })

  function chooseFile(selected: File | undefined) {
    if (!selected) return
    if (selected.size === 0 || selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('Choose a non-empty file no larger than 50 MB.')
      return
    }
    setFile(selected)
    setFileError('')
  }

  if (documentQuery.isLoading) return <p className="text-sm text-slate-500">Loading document…</p>
  if (documentQuery.isError || !document) return <ErrorMessage message={getApiErrorMessage(documentQuery.error, 'The document could not be loaded.')} />

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link to={`/documents/${id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700">
        <ArrowLeft size={16} aria-hidden="true" /> Back to document
      </Link>
      <PageHeader title="Amend document" description="Correct every editable field, optionally upload a replacement version, and send it back for review." />
      {feedback && (feedback.comment || feedback.amendmentComment || feedback.rejectionReason) && (
        <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <h2 className="font-semibold">Manager feedback</h2>
          {feedback.comment && <p className="mt-1 text-sm leading-6">{feedback.comment}</p>}
          {feedback.amendmentSections && <p className="mt-2 text-sm"><span className="font-medium">Areas to change:</span> {feedback.amendmentSections}</p>}
          {feedback.amendmentComment && feedback.amendmentComment !== feedback.comment && <p className="mt-2 text-sm leading-6">{feedback.amendmentComment}</p>}
          {feedback.rejectionReason && feedback.rejectionReason !== feedback.comment && <p className="mt-2 text-sm leading-6">{feedback.rejectionReason}</p>}
        </section>
      )}
      {saveMutation.isError && <div className="mt-5"><ErrorMessage message={getApiErrorMessage(saveMutation.error, 'The document could not be amended.')} /></div>}
      <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="mt-6 space-y-6">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-slate-900">Record metadata</h2>
            <p className="mt-1 text-sm text-slate-500">Update the information the manager asked you to correct.</p>
          </div>
          <Input label="Document title" {...register('title')} error={errors.title?.message} />
          <TextareaField label="Description" rows={5} {...register('description')} error={errors.description?.message} />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Category" {...register('categoryId')} error={errors.categoryId?.message}>
              {(categoriesQuery.data ?? []).map((category) => <option key={category.categoryId} value={category.categoryId}>{category.name}</option>)}
            </SelectField>
            <SelectField label="Department" {...register('departmentId')} error={errors.departmentId?.message}>
              {(departmentsQuery.data ?? []).filter((department) => !hasRole('DEPT_USER') || department.departmentId === accountQuery.data?.department?.departmentId).map((department) => <option key={department.departmentId} value={department.departmentId}>{department.name}</option>)}
              {canUseOther && <option value="__OTHER__">Other department</option>}
            </SelectField>
          </div>
          {canUseOther && watch('departmentId') === '__OTHER__' && <Input label="Other department name" {...register('otherDepartmentName')} error={errors.otherDepartmentName?.message} />}
          {hasRole('ARCHIVIST') && <SelectField label="Classification" {...register('classification')} error={errors.classification?.message}>
            <option value="PUBLIC">Public</option><option value="INTERNAL">Internal</option><option value="CONFIDENTIAL">Confidential</option><option value="SECRET">Secret</option>
          </SelectField>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900">Change document file (optional)</h2>
          <p className="mt-1 text-sm text-slate-500">Upload the corrected document to create a new version. The existing versions remain in history.</p>
          <input className="mt-4 block w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" type="file" onChange={(event) => chooseFile(event.target.files?.[0])} />
          {fileError && <p className="mt-2 text-sm text-rose-700">{fileError}</p>}
        </section>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(`/documents/${id}`)} disabled={saveMutation.isPending}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending || categoriesQuery.isLoading || departmentsQuery.isLoading}>
            <CheckCircle2 size={17} aria-hidden="true" /> {saveMutation.isPending ? 'Saving and submitting…' : 'Save and submit for review'}
          </Button>
        </div>
      </form>
    </div>
  )
}
