export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center py-12 text-sm text-gray-500">
      {label}
    </div>
  )
}