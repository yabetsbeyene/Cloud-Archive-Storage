import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Search, ShieldCheck, UserRound, UserX } from 'lucide-react'
import { usersApi } from '@/api/users.api'
import { departmentsApi } from '@/api/departments.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from '@/features/auth/types'
import type { ManagedUser } from '@/types/user'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { formatDate } from '@/utils/format'

const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, underscores, or hyphens'),
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().trim().email('Enter a valid email address').max(255),
  temporaryPassword: z.string().max(128).optional(),
  role: z.enum(['ADMIN', 'ARCHIVIST', 'MANAGER', 'DEPT_USER', 'VIEWER']),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
})

type UserFormValues = z.infer<typeof userSchema>

export function UsersPage() {
  const { user: authUser, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [deactivating, setDeactivating] = useState<ManagedUser | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.me,
  })
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    enabled: isAdmin,
  })
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { isActive: true, role: 'VIEWER' },
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeForm()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ sub, values }: { sub: string; values: UserFormValues }) =>
      usersApi.update(sub, {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: values.role,
        departmentId: values.departmentId || undefined,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeForm()
    },
  })
  const deactivateMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeactivating(null)
    },
  })

  const visibleUsers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return usersQuery.data ?? []
    return (usersQuery.data ?? []).filter((user) =>
      [user.fullName, user.username, user.email, user.department?.name, user.role]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    )
  }, [search, usersQuery.data])

  function openCreate() {
    setEditing(null)
    reset({
      username: '',
      fullName: '',
      email: '',
      temporaryPassword: '',
      role: 'VIEWER',
      departmentId: '',
      isActive: true,
    })
    setIsFormOpen(true)
  }

  function openEdit(user: ManagedUser) {
    setEditing(user)
    reset({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      temporaryPassword: '',
      role: user.role,
      departmentId: user.department?.departmentId ?? '',
      isActive: user.isActive,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditing(null)
    createMutation.reset()
    updateMutation.reset()
  }

  function submit(values: UserFormValues) {
    if (editing) {
      updateMutation.mutate({ sub: editing.userSub, values })
      return
    }
    if (!values.temporaryPassword || values.temporaryPassword.length < 8) {
      return
    }
    createMutation.mutate({
      username: values.username.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      temporaryPassword: values.temporaryPassword,
      role: values.role,
      departmentId: values.departmentId || undefined,
      isActive: values.isActive,
    })
  }

  const saveMutation = editing ? updateMutation : createMutation

  return (
    <div>
      <PageHeader
        title="User management"
        description="Review your application profile and manage the people linked to Keycloak."
        action={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus size={17} aria-hidden="true" />
              Create user
            </Button>
          ) : undefined
        }
      />

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
            <UserRound size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">Your profile</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Synchronized from your authenticated account.
            </p>
          </div>
        </div>
        {profileQuery.isLoading && <ProfileSkeleton />}
        {profileQuery.isError && (
          <div className="p-5">
            <InlineError
              message={getApiErrorMessage(profileQuery.error, 'Your profile could not be loaded.')}
              onRetry={() => profileQuery.refetch()}
            />
          </div>
        )}
        {profileQuery.data && (
          <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
            <ProfileField label="Name" value={profileQuery.data.fullName} />
            <ProfileField label="Email" value={profileQuery.data.email} />
            <ProfileField label="Department" value={profileQuery.data.department?.name ?? 'Unassigned'} />
            <ProfileField
              label="Your role"
              value={authUser?.roles.map(formatRole).join(', ') || 'No application role'}
            />
          </dl>
        )}
      </section>

      {!isAdmin && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-8 text-center">
          <ShieldCheck className="mx-auto text-slate-400" size={28} aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-950">Administrator access required</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">
            Your profile is available above. The organization-wide user directory and account
            controls are restricted to administrators.
          </p>
        </section>
      )}

      {isAdmin && (
        <section className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Application users</h2>
              <p className="mt-1 text-sm text-slate-600">
                Create login accounts, assign one archive role, and control access without copying UUIDs.
              </p>
            </div>
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Search users</span>
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, username, email, role…"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>

          {usersQuery.isLoading && <UsersSkeleton />}
          {usersQuery.isError && (
            <div className="mt-4">
              <InlineError
                message={getApiErrorMessage(usersQuery.error, 'Users could not be loaded.')}
                onRetry={() => usersQuery.refetch()}
              />
            </div>
          )}
          {usersQuery.data && visibleUsers.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="font-semibold text-slate-950">
                {search ? 'No users match your search' : 'No application users yet'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {search
                  ? 'Try a name, email address, department, or user ID.'
                  : 'Add a user after their Keycloak account is ready.'}
              </p>
            </div>
          )}
          {visibleUsers.length > 0 && (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Department</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Added</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUsers.map((user) => (
                      <tr key={user.userSub}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-950">{user.fullName}</p>
                          <p className="mt-0.5 text-xs text-slate-600">@{user.username} · {user.email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{user.department?.name ?? 'Unassigned'}</td>
                        <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><UserStatus active={user.isActive} /></div></td>
                        <td className="px-5 py-4 text-slate-600">{user.createdAt ? formatDate(user.createdAt) : 'Not linked'}</td>
                        <td className="px-5 py-4"><UserActions user={user} currentSub={authUser?.sub} onEdit={openEdit} onDeactivate={setDeactivating} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3 lg:hidden">
                {visibleUsers.map((user) => (
                  <article key={user.userSub} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-950">{user.fullName}</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-600">@{user.username} · {user.email}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2"><RoleBadge role={user.role} /><UserStatus active={user.isActive} /></div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                      <div><dt className="text-xs text-slate-500">Department</dt><dd className="mt-1 text-slate-800">{user.department?.name ?? 'Unassigned'}</dd></div>
                      <div><dt className="text-xs text-slate-500">Added</dt><dd className="mt-1 text-slate-800">{user.createdAt ? formatDate(user.createdAt) : 'Not linked'}</dd></div>
                    </dl>
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <UserActions user={user} currentSub={authUser?.sub} onEdit={openEdit} onDeactivate={setDeactivating} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editing ? 'Edit user access' : 'Create user account'}>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {!editing && (
            <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm leading-5 text-indigo-800">
              This creates both the Keycloak login and its matching archive profile. No UUID is required.
            </p>
          )}
          <Input
            label="Username"
            placeholder="for example, abebe.kebede"
            readOnly={Boolean(editing)}
            className={editing ? 'bg-slate-50 text-slate-500' : ''}
            {...register('username')}
            error={errors.username?.message}
          />
          <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Email address" type="email" {...register('email')} error={errors.email?.message} />
          {!editing && (
            <Input
              label="Temporary password"
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              {...register('temporaryPassword', {
                validate: (value) =>
                  editing || (value?.length ?? 0) >= 8 || 'Temporary password must be at least 8 characters',
              })}
              error={errors.temporaryPassword?.message}
            />
          )}
          <SelectField label="Application role" {...register('role')} error={errors.role?.message}>
            <option value="VIEWER">Viewer — read-only access</option>
            <option value="DEPT_USER">Department user — create and edit documents</option>
            <option value="MANAGER">Manager — review and approve documents</option>
            <option value="ARCHIVIST">Archivist — archive and records administration</option>
            <option value="ADMIN">Administrator — full system access</option>
          </SelectField>
          <SelectField label="Department" {...register('departmentId')} error={errors.departmentId?.message}>
            <option value="">Unassigned</option>
            {(departmentsQuery.data ?? []).map((department) => (
              <option key={department.departmentId} value={department.departmentId}>{department.name}</option>
            ))}
          </SelectField>
          {!editing && (
            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5 size-4 accent-indigo-600" {...register('isActive')} />
              <span><span className="block font-medium text-slate-900">Active immediately</span>The user can sign in with the temporary password and will be required to replace it.</span>
            </label>
          )}
          {editing && (
            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5 size-4 accent-indigo-600" {...register('isActive')} />
              <span><span className="block font-medium text-slate-900">Account active</span>Turning this off disables both the Keycloak login and archive access.</span>
            </label>
          )}
          {saveMutation.isError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {getApiErrorMessage(saveMutation.error, 'The user could not be saved. Check the details and try again.')}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending || departmentsQuery.isLoading}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save access' : 'Create user'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deactivating !== null}
        title="Deactivate user"
        message={`Deactivate ${deactivating?.fullName}? Their archive profile will be disabled, but their Keycloak account is not deleted.`}
        confirmLabel="Deactivate"
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivating && deactivateMutation.mutate(deactivating.userSub)}
        onCancel={() => {
          setDeactivating(null)
          deactivateMutation.reset()
        }}
      />
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-200 px-5 py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:border-l lg:border-t-0 lg:first:border-l-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-slate-950">
        {value}
      </dd>
    </div>
  )
}

function UserStatus({ active }: { active: boolean }) {
  if (active) {
    return <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
  }
  return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Inactive</span>
}

function UserActions({ user, currentSub, onEdit, onDeactivate }: { user: ManagedUser; currentSub?: string; onEdit: (user: ManagedUser) => void; onDeactivate: (user: ManagedUser) => void }) {
  const isCurrentUser = user.userSub === currentSub
  return (
    <div className="flex justify-end gap-1">
      <button type="button" onClick={() => onEdit(user)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        <Pencil size={15} aria-hidden="true" /> Edit
      </button>
      <button type="button" onClick={() => onDeactivate(user)} disabled={!user.isActive || isCurrentUser} title={isCurrentUser ? 'You cannot deactivate your own account' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:text-rose-300 disabled:hover:bg-transparent">
        <UserX size={15} aria-hidden="true" /> Deactivate
      </button>
    </div>
  )
}

function RoleBadge({ role }: { role: Role }) {
  return <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{formatRole(role)}</span>
}

function formatRole(role: Role) {
  return role.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' ')
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button variant="secondary" className="min-h-9 bg-white px-3" onClick={onRetry}>Try again</Button>
    </div>
  )
}

function ProfileSkeleton() {
  return <div role="status" aria-label="Loading profile" className="grid animate-pulse grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 bg-white p-5"><div className="h-3 w-16 rounded bg-slate-100" /><div className="mt-3 h-4 w-28 rounded bg-slate-100" /></div>)}</div>
}

function UsersSkeleton() {
  return <div role="status" aria-label="Loading users" className="mt-4 animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex h-20 items-center gap-6 border-b border-slate-100 px-5 last:border-0"><div className="h-4 w-48 rounded bg-slate-100" /><div className="h-4 w-32 rounded bg-slate-100" /><div className="h-6 w-16 rounded-full bg-slate-100" /></div>)}</div>
}
