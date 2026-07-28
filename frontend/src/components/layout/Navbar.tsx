import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'

interface NavbarProps {
  onOpenMenu: () => void
}

export function Navbar({ onOpenMenu }: NavbarProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid min-h-11 min-w-11 place-items-center rounded-md text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium text-gray-800">{user?.name || user?.username}</p>
          <p className="hidden truncate text-xs text-gray-600 sm:block">
            {user?.roles.join(', ') || 'No assigned role'}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>
      </div>
    </header>
  )
}
