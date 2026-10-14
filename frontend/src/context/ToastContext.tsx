import { useCallback, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastItem, type ToastType } from './toast-context'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((prev) => [...prev.slice(-4), { id, message, type }])
      setTimeout(() => {
        removeToast(id)
      }, 3500)
    },
    [removeToast],
  )

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast])
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast])
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`} role="status">
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <p className="toast-message">{toast.message}</p>
            <button
              type="button"
              className="toast-close"
              aria-label="Close notification"
              onClick={() => removeToast(toast.id)}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
