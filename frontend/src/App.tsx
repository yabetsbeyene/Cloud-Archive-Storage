import { useAuth } from '@/features/auth/auth-context'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  const { isLoading, initializationError } = useAuth()

  // Wait for Keycloak's initial check-sso to resolve before rendering any
  // routes — otherwise ProtectedRoute would briefly redirect to /login on
  // every page load, even for an already-authenticated user.
  if (isLoading) {
    return (
      <div
        className="flex min-h-svh items-center justify-center bg-gray-50 px-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-gray-600">Loading…</p>
      </div>
    )
  }

  if (initializationError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Unable to start the application</h1>
          <p className="mt-3 text-gray-600">{initializationError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Reload page
          </button>
        </div>
      </main>
    )
  }

  return <AppRoutes />
}

export default App
