export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
      {message}
    </div>
  )
}