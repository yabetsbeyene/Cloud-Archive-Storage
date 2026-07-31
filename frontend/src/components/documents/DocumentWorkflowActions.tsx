import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Inbox, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { workflowApi } from '@/api/workflow.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import type { Document } from '@/types/document'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextareaField } from '@/components/ui/TextareaField'

export function DocumentWorkflowActions({
  document,
  compact = false,
}: {
  document: Document
  compact?: boolean
}) {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [isRejecting, setIsRejecting] = useState(false)
  const [comment, setComment] = useState('')
  const [validationError, setValidationError] = useState('')

  const canReview = hasRole('ADMIN') || hasRole('MANAGER') || hasRole('ARCHIVIST')
  const canDecide = hasRole('ADMIN') || hasRole('MANAGER')
  const canArchive = hasRole('ADMIN') || hasRole('ARCHIVIST')
  const canResubmit =
    document.createdBy === user?.sub &&
    (hasRole('DEPT_USER') || hasRole('ARCHIVIST') || hasRole('ADMIN'))

  const mutation = useMutation({
    mutationFn: async (action: 'start' | 'approve' | 'reject' | 'archive' | 'resubmit') => {
      if (action === 'start') return workflowApi.startReview(document.documentId)
      if (action === 'approve') return workflowApi.approve(document.documentId)
      if (action === 'archive') return workflowApi.archive(document.documentId)
      if (action === 'resubmit') return workflowApi.submit(document.documentId, { comment })
      return workflowApi.reject(document.documentId, { comment })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['review-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['document', document.documentId] }),
        queryClient.invalidateQueries({ queryKey: ['workflow-history', document.documentId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      setIsRejecting(false)
      setComment('')
      setValidationError('')
    },
  })

  function reject() {
    if (!comment.trim()) {
      setValidationError('Explain what the creator must correct before resubmitting.')
      return
    }
    mutation.mutate('reject')
  }

  const buttonClass = compact ? 'min-h-9 px-3' : ''

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {document.status === 'SUBMITTED' && canReview && (
          <Button className={buttonClass} onClick={() => mutation.mutate('start')} disabled={mutation.isPending}>
            <Inbox size={16} aria-hidden="true" /> Start review
          </Button>
        )}
        {document.status === 'UNDER_REVIEW' && canDecide && (
          <>
            <Button className={buttonClass} onClick={() => mutation.mutate('approve')} disabled={mutation.isPending}>
              <Check size={16} aria-hidden="true" /> Approve
            </Button>
            <Button className={buttonClass} variant="danger" onClick={() => setIsRejecting(true)} disabled={mutation.isPending}>
              <X size={16} aria-hidden="true" /> Reject
            </Button>
          </>
        )}
        {document.status === 'APPROVED' && canArchive && (
          <Button className={buttonClass} onClick={() => mutation.mutate('archive')} disabled={mutation.isPending}>
            <ShieldCheck size={16} aria-hidden="true" /> Archive
          </Button>
        )}
        {document.status === 'REJECTED' && canResubmit && (
          <Button className={buttonClass} onClick={() => mutation.mutate('resubmit')} disabled={mutation.isPending}>
            <RotateCcw size={16} aria-hidden="true" /> Resubmit
          </Button>
        )}
      </div>
      {mutation.isError && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {getApiErrorMessage(mutation.error, 'The workflow action could not be completed.')}
        </p>
      )}
      <Modal isOpen={isRejecting} onClose={() => setIsRejecting(false)} title="Return document for correction">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            The creator will see this explanation and can correct and resubmit the document.
          </p>
          <TextareaField
            label="Required correction"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              setValidationError('')
            }}
            error={validationError}
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRejecting(false)}>Cancel</Button>
            <Button variant="danger" onClick={reject} disabled={mutation.isPending}>
              {mutation.isPending ? 'Returning…' : 'Reject with explanation'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
