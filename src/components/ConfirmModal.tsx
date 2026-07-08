import { Modal } from './Modal'
import type { ReactNode } from 'react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  icon?: ReactNode
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading,
  onConfirm,
  onCancel,
  icon,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} hideClose>
      <div className="text-center">
        {icon && (
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-lavender-100 text-lavender-600">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-extrabold text-lavender-700">{title}</h2>
        <div className="mt-2 text-[15px] leading-relaxed text-lavender-700/70">{message}</div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            className={
              tone === 'danger'
                ? 'btn text-white bg-gradient-to-br from-peach-400 to-peach-500 shadow-soft'
                : 'btn-primary'
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
