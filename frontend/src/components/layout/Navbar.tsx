import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { accountApi } from '@/api/account.api'
import { ProfileAvatar } from '@/components/account/ProfileAvatar'
import { useAuth } from '@/features/auth/auth-context'

interface NavbarProps {
  onOpenMenu: () => void
}

const roleLabels = {
  ADMIN: 'Administrator',
  ARCHIVIST: 'Archivist',
  MANAGER: 'Manager',
  DEPT_USER: 'Department user',
  VIEWER: 'Viewer',
}

export function Navbar({ onOpenMenu }: NavbarProps) {
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const profileQuery = useQuery({
    queryKey: ['account'],
    queryFn: accountApi.get,
  })
  const profile = profileQuery.data
  const displayName = profile?.fullName || user?.name || user?.username || 'Account'
  const role = profile?.role

  useEffect(() => {
    if (!isProfileOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsProfileOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
        requestAnimationFrame(() => triggerRef.current?.focus())
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isProfileOpen])

  return (
    <header className="relative z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.04)] sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="ml-auto" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsProfileOpen((current) => !current)}
          className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 text-left outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"
          aria-expanded={isProfileOpen}
          aria-controls="account-popover"
          data-profile-trigger
        >
          <ProfileAvatar
            userSub={profile?.userSub}
            name={displayName}
            profilePictureUpdatedAt={profile?.profilePictureUpdatedAt}
            size="md"
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-48 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {displayName}
            </span>
            <span className="block max-w-48 truncate text-xs text-slate-500 dark:text-slate-400">
              {role ? roleLabels[role] : 'Loading profile…'}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`hidden text-slate-400 transition-transform sm:block ${
              isProfileOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {isProfileOpen && (
          <div
            id="account-popover"
            className="absolute right-4 top-[calc(100%+0.5rem)] w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 sm:right-6"
          >
            <div className="bg-slate-950 px-5 py-5 text-white">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  userSub={profile?.userSub}
                  name={displayName}
                  profilePictureUpdatedAt={profile?.profilePictureUpdatedAt}
                  size="lg"
                  className="ring-slate-800"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-300">
                    {profile?.email || user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {role ? roleLabels[role] : 'Archive user'}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
                  {profile?.department?.name || 'No department'}
                </span>
              </div>
            </div>

            <div className="p-2">
              <Link
                to="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-indigo-950 transition hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-100 dark:hover:bg-indigo-950 dark:hover:text-indigo-200"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  <UserRound size={16} aria-hidden="true" />
                </span>
                <span>
                  <span className="block">View profile</span>
                  <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                    Photo and personal details
                  </span>
                </span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="mt-1 flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Settings size={16} aria-hidden="true" />
                </span>
                Account settings
              </Link>
            </div>

            <div className="border-t border-slate-200 p-2 dark:border-slate-700">
              <button
                type="button"
                onClick={logout}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-300 dark:hover:bg-rose-950"
              >
                <LogOut size={17} aria-hidden="true" />
                Sign out securely
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
