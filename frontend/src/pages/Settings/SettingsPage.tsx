import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react'
import { accountApi } from '@/api/account.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import {
  useTheme,
  type ThemePreference,
} from '@/features/theme/theme-context'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Use at least 3 characters')
    .max(150)
    .regex(
      /^[A-Za-z0-9._-]+$/,
      'Use only letters, numbers, dots, underscores or hyphens',
    ),
  fullName: z.string().min(1, 'Full name is required').max(200),
  email: z.email('Enter a valid email address').max(255),
})

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(128)
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const roleLabels = {
  ADMIN: 'Administrator',
  ARCHIVIST: 'Archivist',
  MANAGER: 'Manager',
  DEPT_USER: 'Department user',
  VIEWER: 'Viewer',
}

const themeOptions: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright workspace for daytime use.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Reduced glare in low-light environments.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow this device’s appearance setting.',
    icon: Monitor,
  },
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const { preference, resolvedTheme, setPreference, isSaving: isThemeSaving, error: themeError } = useTheme()
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['account'],
    queryFn: accountApi.get,
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '', fullName: '', email: '' },
  })
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        username: profileQuery.data.username,
        fullName: profileQuery.data.fullName,
        email: profileQuery.data.email,
      })
    }
  }, [profileForm, profileQuery.data])

  const profileMutation = useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(['account'], profile)
      setProfileSaved(true)
      await refreshUser()
    },
  })

  const passwordMutation = useMutation({
    mutationFn: accountApi.changePassword,
    onSuccess: () => {
      passwordForm.reset()
      setPasswordSaved(true)
    },
  })

  if (profileQuery.isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Account settings"
        description="Manage your identity, dashboard appearance, and account security."
      />

      {profileQuery.isError && (
        <div className="mt-6">
          <ErrorMessage
            message={getApiErrorMessage(
              profileQuery.error,
              'Your account settings could not be loaded.',
            )}
          />
        </div>
      )}

      {profileQuery.data && (
        <div className="mt-6 space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 text-indigo-600" size={20} aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-slate-950">Profile</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    This identity appears beside documents you upload.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                  {roleLabels[profileQuery.data.role]}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  {profileQuery.data.department?.name || 'No department assigned'}
                </span>
              </div>
            </div>

            <form
              onSubmit={profileForm.handleSubmit((values) => {
                setProfileSaved(false)
                profileMutation.mutate(values)
              })}
              className="px-5 py-5 sm:px-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Username"
                  autoComplete="username"
                  {...profileForm.register('username')}
                  error={profileForm.formState.errors.username?.message}
                />
                <Input
                  label="Full name"
                  autoComplete="name"
                  {...profileForm.register('fullName')}
                  error={profileForm.formState.errors.fullName?.message}
                />
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  className="sm:col-span-2"
                  {...profileForm.register('email')}
                  error={profileForm.formState.errors.email?.message}
                />
              </div>

              {profileMutation.isError && (
                <div className="mt-4">
                  <ErrorMessage
                    message={getApiErrorMessage(
                      profileMutation.error,
                      'Your profile could not be updated.',
                    )}
                  />
                </div>
              )}
              {profileSaved && (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Profile updated
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <Button
                  type="submit"
                  disabled={profileMutation.isPending || !profileForm.formState.isDirty}
                >
                  {profileMutation.isPending ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
              <Palette className="mt-0.5 text-indigo-600" size={20} aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-slate-950">Dashboard theme</h2>
                <p className="mt-1 text-sm text-slate-600">
                  This preference is saved to your account and follows you across devices.
                </p>
              </div>
            </div>
            <fieldset className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
              <legend className="sr-only">Dashboard theme</legend>
              {themeOptions.map(({ value, label, description, icon: Icon }) => {
                const selected = preference === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreference(value)}
                    disabled={isThemeSaving}
                    className={`min-h-28 rounded-xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon
                        size={19}
                        className={selected ? 'text-indigo-700' : 'text-slate-500'}
                        aria-hidden="true"
                      />
                      {selected && (
                        <CheckCircle2 size={17} className="text-indigo-700" aria-hidden="true" />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                  </button>
                )
              })}
            </fieldset>
            {themeError && (
              <p role="alert" className="px-5 pb-3 text-sm text-rose-700 sm:px-6">
                {themeError}
              </p>
            )}
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-6">
              Current appearance: {resolvedTheme}
              {isThemeSaving ? ' · Saving to your account…' : ' · Saved to your account'}
            </p>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
              <ShieldCheck className="mt-0.5 text-indigo-600" size={20} aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-slate-950">Password</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Use at least 12 characters with uppercase, lowercase, and a number.
                </p>
              </div>
            </div>

            <form
              onSubmit={passwordForm.handleSubmit((values) => {
                setPasswordSaved(false)
                passwordMutation.mutate(values)
              })}
              className="px-5 py-5 sm:px-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                  error={passwordForm.formState.errors.newPassword?.message}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmPassword')}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                />
              </div>

              {passwordMutation.isError && (
                <div className="mt-4">
                  <ErrorMessage
                    message={getApiErrorMessage(
                      passwordMutation.error,
                      'Your password could not be changed.',
                    )}
                  />
                </div>
              )}
              {passwordSaved && (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Password changed successfully
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  <KeyRound size={17} aria-hidden="true" />
                  {passwordMutation.isPending ? 'Changing…' : 'Change password'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading account settings" className="mx-auto max-w-5xl animate-pulse">
      <div className="h-9 w-64 rounded bg-slate-200" />
      <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />
      <div className="mt-8 h-80 rounded-xl bg-slate-200" />
      <div className="mt-6 h-64 rounded-xl bg-slate-200" />
    </div>
  )
}
