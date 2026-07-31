import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { departmentsApi } from '@/api/departments.api'
import type { Department } from '@/types/department'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useAuth } from '@/features/auth/auth-context'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(1000).optional(),
})
type FormValues = z.infer<typeof schema>

export function DepartmentsPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('ADMIN')
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Department | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Department | null>(null)

  const { data: departments, isLoading, isError } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FormValues }) =>
      departmentsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleting(null)
    },
  })

  function openCreateForm() {
    setEditing(null)
    reset({ name: '', description: '' })
    setIsFormOpen(true)
  }

  function openEditForm(department: Department) {
    setEditing(department)
    reset({ name: department.name, description: department.description ?? '' })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditing(null)
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.departmentId, input: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Departments</h1>
        {canManage && (
          <Button onClick={openCreateForm}>
            <Plus size={16} /> New department
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading && <LoadingSpinner label="Loading departments…" />}
        {isError && <ErrorMessage message="Failed to load departments." />}
        {!isLoading && !isError && departments && departments.length === 0 && (
          <EmptyState message="No departments yet. Create the first one." />
        )}

        {!isLoading && !isError && departments && departments.length > 0 && (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.departmentId} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-800">{dept.name}</td>
                    <td className="px-4 py-3 text-gray-500">{dept.description || '—'}</td>
                    {canManage && <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditForm(dept)}
                          aria-label={`Edit ${dept.name}`}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleting(dept)}
                          aria-label={`Delete ${dept.name}`}
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

      <Modal isOpen={canManage && isFormOpen} onClose={closeForm} title={editing ? 'Edit department' : 'New department'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Description" {...register('description')} error={errors.description?.message} />
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
        title="Delete department"
        message={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.departmentId)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
