import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { categoriesApi } from '@/api/categories.api'
import type { Category } from '@/types/category'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(1000).optional(),
  retentionPeriodMonths: z.coerce.number().int().min(0, 'Must be 0 or more').optional(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function CategoriesPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('ADMIN')
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Category | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) => categoriesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleting(null)
    },
  })

  function openCreateForm() {
    setEditing(null)
    reset({ name: '', description: '', retentionPeriodMonths: undefined })
    setIsFormOpen(true)
  }

  function openEditForm(category: Category) {
    setEditing(category)
    reset({
      name: category.name,
      description: category.description ?? '',
      retentionPeriodMonths: category.retentionPeriodMonths ?? undefined,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditing(null)
    createMutation.reset()
    updateMutation.reset()
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.categoryId, input: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Categories</h1>
        {canManage && (
          <Button onClick={openCreateForm}>
            <Plus size={16} /> New category
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading && <LoadingSpinner label="Loading categories…" />}
        {isError && <ErrorMessage message="Failed to load categories." />}
        {!isLoading && !isError && categories && categories.length === 0 && (
          <EmptyState message="No categories yet. Create the first one." />
        )}

        {!isLoading && !isError && categories && categories.length > 0 && (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Retention (months)</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.categoryId} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.retentionPeriodMonths ?? '—'}</td>
                    {canManage && <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditForm(cat)}
                          aria-label={`Edit ${cat.name}`}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleting(cat)}
                          aria-label={`Delete ${cat.name}`}
                          className="rounded-md p-1.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={canManage && isFormOpen} onClose={closeForm} title={editing ? 'Edit category' : 'New category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Description" {...register('description')} error={errors.description?.message} />
          <Input
            label="Retention period (months)"
            type="number"
            {...register('retentionPeriodMonths')}
            error={errors.retentionPeriodMonths?.message}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getApiErrorMessage(
                editing ? updateMutation.error : createMutation.error,
                'The category could not be saved. Check the values and try again.',
              )}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={canManage && deleting !== null}
        title="Delete category"
        message={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.categoryId)}
        onCancel={() => setDeleting(null)}
      />
      {deleteMutation.isError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-rose-700 px-4 py-3 text-sm text-white shadow-lg" role="alert">
          {getApiErrorMessage(deleteMutation.error, 'The category could not be deleted.')}
        </div>
      )}
    </div>
  )
}
