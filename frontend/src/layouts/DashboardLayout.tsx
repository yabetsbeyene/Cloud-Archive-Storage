import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

export function DashboardLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  return (
    <div className="flex min-h-svh overflow-hidden bg-gray-50">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-white px-4 py-2 font-medium text-gray-900 shadow-lg focus:translate-y-0"
      >
        Skip to content
      </a>

      {isNavigationOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 md:hidden"
          onClick={() => setIsNavigationOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <Sidebar isOpen={isNavigationOpen} onClose={() => setIsNavigationOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onOpenMenu={() => setIsNavigationOpen(true)} />
        <main id="main-content" className="flex-1 scroll-smooth overflow-y-auto p-4 sm:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
