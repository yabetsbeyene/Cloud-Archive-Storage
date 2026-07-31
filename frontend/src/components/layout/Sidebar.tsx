import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Building2,
  Users,
  ClipboardList,
  ListChecks,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from '@/features/auth/types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: Role[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/reviews', label: 'Review queue', icon: ListChecks, roles: ['ADMIN', 'ARCHIVIST', 'MANAGER'] },
  { to: '/categories', label: 'Categories', icon: FolderKanban },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['ADMIN', 'ARCHIVIST'] },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { hasRole } = useAuth()
  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.some((role) => hasRole(role)),
  )

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Primary navigation"
    >
      <div className="flex min-h-16 items-center justify-between border-b border-slate-800 px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-wide text-white">
          Digital Archive
        </span>
        <button
          type="button"
          onClick={onClose}
          className="grid min-h-11 min-w-11 place-items-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          aria-label="Close navigation"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
