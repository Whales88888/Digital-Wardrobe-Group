import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void | Promise<void>
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  busy = false,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, busy, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-panel confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-heading">
          <div className="confirm-header-content">
            {isDestructive && (
              <span className="confirm-icon danger">
                <AlertTriangle size={20} />
              </span>
            )}
            <div>
              <h2 id="confirm-title">{title}</h2>
              <p>{message}</p>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-actions">
          <button
            className="button-secondary button-small"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`button-small ${isDestructive ? 'button-danger' : 'button-primary'}`}
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
