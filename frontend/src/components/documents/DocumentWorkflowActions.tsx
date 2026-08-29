import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check, Inbox, PencilLine, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { workflowApi } from '@/api/workflow.api'
import { getApiErrorMessage } from '@/api/error-message'
import { useAuth } from '@/features/auth/auth-context'
import type { ClassificationLevel, Document } from '@/types/document'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/SelectField'
import { TextareaField } from '@/components/ui/TextareaField'

const amendmentOptions = [['metadata', 'Metadata or title'], ['description', 'Description'], ['category', 'Category'], ['file', 'Uploaded file or version'], ['other', 'Other']] as const
const classificationOptions: ClassificationLevel[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET']

export function DocumentWorkflowActions({ document, compact = false }: { document: Document; compact?: boolean }) {
  const { user, hasRole } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<'reject' | 'amend' | 'archive' | null>(null)
  const [comment, setComment] = useState('')
  const [sections, setSections] = useState<string[]>([])
  const [otherSection, setOtherSection] = useState('')
  const [classification, setClassification] = useState<ClassificationLevel | ''>('')
  const [validationError, setValidationError] = useState('')
  const mutation = useMutation({
    mutationFn: async (action: 'start' | 'submit' | 'approve' | 'reject' | 'amend' | 'archive' | 'begin-edit') => {
      if (action === 'start') return workflowApi.startReview(document.documentId)
      if (action === 'submit') return workflowApi.submit(document.documentId)
      if (action === 'approve') return workflowApi.approve(document.documentId)
      if (action === 'reject') return workflowApi.reject(document.documentId, { comment })
      if (action === 'amend') return workflowApi.amend(document.documentId, { amendmentSections: sections.includes('other') && otherSection.trim() ? [...sections.filter(section => section !== 'other'), otherSection.trim()] : sections, amendmentComment: comment })
      if (action === 'archive') return workflowApi.archive(document.documentId, { classification: classification as ClassificationLevel })
      return workflowApi.beginEdit(document.documentId)
    },
    onSuccess: async () => {
      await Promise.all(['documents', 'review-queue', 'dashboard'].map(queryKey => queryClient.invalidateQueries({ queryKey: [queryKey] })))
      await queryClient.invalidateQueries({ queryKey: ['document', document.documentId] })
      setModal(null); setComment(''); setSections([]); setOtherSection(''); setClassification(''); setValidationError('')
    },
  })
  const canDecide = hasRole('MANAGER')
  const canArchive = hasRole('ARCHIVIST')
  const canStartEdit = document.createdBy === user?.sub
    && (hasRole('ADMIN') || hasRole('ARCHIVIST') || hasRole('DEPT_USER'))
  const buttonClass = compact ? 'min-h-9 px-3' : ''
  function submitModal(action: 'reject' | 'amend' | 'archive') {
    if (action === 'reject' && !comment.trim()) return setValidationError('A rejection reason is required.')
    if (action === 'amend' && sections.length === 0) return setValidationError('Select at least one section to amend.')
    if (action === 'amend' && sections.includes('other') && !otherSection.trim()) return setValidationError('Describe the other area to amend.')
    if (action === 'amend' && !comment.trim()) return setValidationError('Describe what the uploader must change.')
    if (action === 'archive' && !classification) return setValidationError('Select a classification before archiving.')
    mutation.mutate(action)
  }
  function closeModal() { if (!mutation.isPending) { setModal(null); setValidationError('') } }
  return <>
    <div className="flex flex-wrap gap-2">
      {document.status === 'SUBMITTED' && canDecide && <Button className={buttonClass} onClick={() => mutation.mutate('start')} disabled={mutation.isPending}><Inbox size={16} aria-hidden="true" /> Start review</Button>}
      {document.status === 'UNDER_REVIEW' && canDecide && <>
        <Button className={buttonClass} onClick={() => mutation.mutate('approve')} disabled={mutation.isPending}><Check size={16} aria-hidden="true" /> Approve</Button>
        <Button className={buttonClass} variant="secondary" onClick={() => setModal('amend')} disabled={mutation.isPending}><PencilLine size={16} aria-hidden="true" /> Amend / Update</Button>
        <Button className={buttonClass} variant="danger" onClick={() => setModal('reject')} disabled={mutation.isPending}><X size={16} aria-hidden="true" /> Reject</Button>
      </>}
      {document.status === 'APPROVED' && canArchive && <Button className={buttonClass} onClick={() => setModal('archive')} disabled={mutation.isPending}><ShieldCheck size={16} aria-hidden="true" /> Classify & archive</Button>}
      {document.status === 'REJECTED' && canStartEdit && <Button className={buttonClass} onClick={() => mutation.mutate('begin-edit', { onSuccess: () => navigate(`/documents/${document.documentId}/edit`) })} disabled={mutation.isPending}><RotateCcw size={16} aria-hidden="true" /> Start edits</Button>}
      {document.status === 'DRAFT' && canStartEdit && <Button className={buttonClass} onClick={() => navigate(`/documents/${document.documentId}/edit`)} disabled={mutation.isPending}><PencilLine size={16} aria-hidden="true" /> Edit and resubmit</Button>}
    </div>
    {mutation.isError && <p role="alert" className="mt-2 text-sm text-rose-700">{getApiErrorMessage(mutation.error, 'The workflow action could not be completed.')}</p>}
    <Modal isOpen={modal === 'reject'} onClose={closeModal} title="Reject document"><div className="space-y-4"><p className="text-sm leading-6 text-slate-600">This reason will be shown to the original uploader.</p><TextareaField label="Mandatory rejection reason" value={comment} onChange={e => { setComment(e.target.value); setValidationError('') }} error={validationError} rows={5} /><ModalActions onCancel={closeModal} onSubmit={() => submitModal('reject')} loading={mutation.isPending} label="Reject document" danger /></div></Modal>
    <Modal isOpen={modal === 'amend'} onClose={closeModal} title="Request amendments"><div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Select the areas the uploader must correct before resubmitting.</p><div><p className="mb-2 text-sm font-medium text-slate-800">What needs to be amended?</p><div className="grid gap-2 sm:grid-cols-2">{amendmentOptions.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={sections.includes(value)} onChange={e => { setSections(current => e.target.checked ? [...current, value] : current.filter(item => item !== value)); setValidationError('') }} className="size-4 accent-indigo-600" />{label}</label>)}</div>{sections.includes('other') && <input value={otherSection} onChange={e => { setOtherSection(e.target.value); setValidationError('') }} placeholder="Describe the other area" className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />}</div><TextareaField label="Comment / description" value={comment} onChange={e => { setComment(e.target.value); setValidationError('') }} error={validationError} rows={5} /><ModalActions onCancel={closeModal} onSubmit={() => submitModal('amend')} loading={mutation.isPending} label="Send back for updates" /></div></Modal>
    <Modal isOpen={modal === 'archive'} onClose={closeModal} title="Classify and archive"><div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Classification is required before this approved document enters the archive.</p><SelectField label="Sensitivity classification" value={classification} onChange={e => { setClassification(e.target.value as ClassificationLevel); setValidationError('') }} error={validationError}><option value="">Select classification</option>{classificationOptions.map(value => <option key={value} value={value}>{value}</option>)}</SelectField><ModalActions onCancel={closeModal} onSubmit={() => submitModal('archive')} loading={mutation.isPending} label="Archive document" /></div></Modal>
  </>
}

function ModalActions({ onCancel, onSubmit, loading, label, danger = false }: { onCancel: () => void; onSubmit: () => void; loading: boolean; label: string; danger?: boolean }) {
  return <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onSubmit} disabled={loading}>{loading ? 'Saving…' : label}</Button></div>
}
