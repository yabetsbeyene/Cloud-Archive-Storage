import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <h1 className="text-4xl font-semibold text-gray-800">404</h1>
      <p className="mt-2 text-gray-600">This page doesn't exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-sm text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
      >
        Back to dashboard
      </Link>
    </main>
  )
}
