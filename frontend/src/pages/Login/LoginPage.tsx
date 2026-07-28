import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <section className="w-full max-w-lg text-center">
      <h1 className="text-balance text-2xl font-semibold text-gray-900 sm:text-3xl">
        Digital Archive & Records Management System
      </h1>
      <p className="mt-3 text-gray-600">Log in securely to manage documents and records.</p>
      <button
        type="button"
        onClick={login}
        className="mt-7 min-h-11 rounded-md bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Log in
      </button>
    </section>
  )
}
