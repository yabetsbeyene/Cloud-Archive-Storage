import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, UserX } from 'lucide-react'
import { usersApi } from '@/api/users.api'
import { accountApi } from '@/api/account.api'
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
import { ProfileAvatar } from '@/components/account/ProfileAvatar'

const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, underscores, or hyphens'),
  fullName: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().trim().email('Enter a valid email address').max(255),
  temporaryPassword: z
    .string()
    .max(128)
    .optional()
    .refine((value) => !value || value.length >= 14, 'Use at least 14 characters')
    .refine((value) => !value || /[a-z]/.test(value), 'Include a lowercase letter')
    .refine((value) => !value || /[A-Z]/.test(value), 'Include an uppercase letter')
    .refine((value) => !value || /[0-9]/.test(value), 'Include a number')
    .refine((value) => !value || /[^A-Za-z0-9\s]/.test(value), 'Include a special character'),
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
  const [deleting, setDeleting] = useState<ManagedUser | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [invitationNotice, setInvitationNotice] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ['account'],
    queryFn: accountApi.get,
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
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { isActive: true, role: 'VIEWER' },
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (_, values) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setInvitationNotice(
        `Invitation sent to ${values.email}. They can verify their address and set a private password from the secure link.`,
      )
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
  const deleteMutation = useMutation({
    mutationFn: usersApi.deletePermanently,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleting(null)
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
    setInvitationNotice(null)
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
    if (!values.temporaryPassword) {
      setError('temporaryPassword', { message: 'Temporary password is required' })
      return
    }
    createMutation.mutate({
      username: values.username.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      temporaryPassword: values.temporaryPassword,
      role: values.role,
      departmentId: values.departmentId || undefined,
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

      {invitationNotice && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
        >
          <MailCheck className="mt-0.5 shrink-0 text-emerald-700" size={19} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Account created and invitation delivered</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">{invitationNotice}</p>
          </div>
        </div>
      )}

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
          <div className="flex flex-col sm:flex-row">
            <div className="flex items-center gap-4 border-b border-slate-200 p-5 sm:w-72 sm:border-b-0 sm:border-r">
              <ProfileAvatar
                userSub={profileQuery.data.userSub}
                name={profileQuery.data.fullName}
                profilePictureUpdatedAt={profileQuery.data.profilePictureUpdatedAt}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">
                  {profileQuery.data.fullName}
                </p>
                <p className="truncate text-sm text-slate-500">
                  @{profileQuery.data.username}
                </p>
              </div>
            </div>
            <dl className="grid flex-1 sm:grid-cols-3">
              <ProfileField label="Email" value={profileQuery.data.email} />
              <ProfileField label="Department" value={profileQuery.data.department?.name ?? 'Unassigned'} />
              <ProfileField
                label="Your role"
                value={authUser?.roles.map(formatRole).join(', ') || 'No application role'}
              />
            </dl>
          </div>
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
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              userSub={user.userSub}
                              name={user.fullName}
                              profilePictureUpdatedAt={user.profilePictureUpdatedAt}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-950">{user.fullName}</p>
                              <p className="mt-0.5 text-xs text-slate-600">@{user.username} · {user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{user.department?.name ?? 'Unassigned'}</td>
                        <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><UserStatus active={user.isActive} /></div></td>
                        <td className="px-5 py-4 text-slate-600">{user.createdAt ? formatDate(user.createdAt) : 'Not linked'}</td>
                        <td className="px-5 py-4"><UserActions user={user} currentSub={authUser?.sub} onEdit={openEdit} onDeactivate={setDeactivating} onDelete={setDeleting} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3 lg:hidden">
                {visibleUsers.map((user) => (
                  <article key={user.userSub} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar
                          userSub={user.userSub}
                          name={user.fullName}
                          profilePictureUpdatedAt={user.profilePictureUpdatedAt}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-950">{user.fullName}</h3>
                          <p className="mt-0.5 truncate text-sm text-slate-600">@{user.username} · {user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2"><RoleBadge role={user.role} /><UserStatus active={user.isActive} /></div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                      <div><dt className="text-xs text-slate-500">Department</dt><dd className="mt-1 text-slate-800">{user.department?.name ?? 'Unassigned'}</dd></div>
                      <div><dt className="text-xs text-slate-500">Added</dt><dd className="mt-1 text-slate-800">{user.createdAt ? formatDate(user.createdAt) : 'Not linked'}</dd></div>
                    </dl>
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <UserActions user={user} currentSub={authUser?.sub} onEdit={openEdit} onDeactivate={setDeactivating} onDelete={setDeleting} />
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
              This creates the Keycloak login and archive profile, then emails a secure password setup
              link with the assigned role and department. No UUID is required.
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
              minLength={14}
              placeholder="14+ characters with a symbol"
              {...register('temporaryPassword')}
              error={errors.temporaryPassword?.message}
            />
          )}
          {!editing && (
            <p className="-mt-2 text-xs leading-5 text-slate-500">
              Use 14 or more characters with uppercase, lowercase, a number, and a special
              character. It is a one-time fallback and is not included in the email.
            </p>
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
              {saveMutation.isPending
                ? editing ? 'Saving…' : 'Creating and sending…'
                : editing ? 'Save access' : 'Create and send invitation'}
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
        error={deactivateMutation.isError
          ? getApiErrorMessage(deactivateMutation.error, 'The user could not be deactivated.')
          : undefined}
        onConfirm={() => deactivating && deactivateMutation.mutate(deactivating.userSub)}
        onCancel={() => {
          setDeactivating(null)
          deactivateMutation.reset()
        }}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Permanently delete user"
        message={`Permanently delete ${deleting?.fullName}? Their Keycloak login and personal profile will be removed. Existing documents and audit records will retain an anonymized “Deleted user” reference. This cannot be undone.`}
        confirmLabel="Delete permanently"
        isLoading={deleteMutation.isPending}
        error={deleteMutation.isError
          ? getApiErrorMessage(deleteMutation.error, 'The user could not be permanently deleted.')
          : undefined}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.userSub)}
        onCancel={() => {
          setDeleting(null)
          deleteMutation.reset()
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

function UserActions({ user, currentSub, onEdit, onDeactivate, onDelete }: { user: ManagedUser; currentSub?: string; onEdit: (user: ManagedUser) => void; onDeactivate: (user: ManagedUser) => void; onDelete: (user: ManagedUser) => void }) {
  const isCurrentUser = user.userSub === currentSub
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <button type="button" onClick={() => onEdit(user)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        <Pencil size={15} aria-hidden="true" /> Edit
      </button>
      <button type="button" onClick={() => onDeactivate(user)} disabled={!user.isActive || isCurrentUser} title={isCurrentUser ? 'You cannot deactivate your own account' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-amber-700 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:text-amber-300 disabled:hover:bg-transparent">
        <UserX size={15} aria-hidden="true" /> Deactivate
      </button>
      <button type="button" onClick={() => onDelete(user)} disabled={isCurrentUser} title={isCurrentUser ? 'You cannot permanently delete your own account' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:text-rose-300 disabled:hover:bg-transparent">
        <Trash2 size={15} aria-hidden="true" /> Delete
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
