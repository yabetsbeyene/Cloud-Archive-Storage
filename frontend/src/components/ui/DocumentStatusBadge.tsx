import type { DocumentStatus } from '@/types/document'
import { documentStatusLabels } from '@/utils/document-status'

const statusStyles: Record<DocumentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  ARCHIVED: 'bg-violet-50 text-violet-700',
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {documentStatusLabels[status]}
    </span>
  )
}
