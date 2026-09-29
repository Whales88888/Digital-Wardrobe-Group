import { AlertCircle, PackageOpen } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading wardrobe data' }: { label?: string }) {
  return <div className="state-panel" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" /><p>{label}</p></div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="state-panel" role="alert"><AlertCircle className="state-icon" size={24} aria-hidden="true" /><h3>We couldn't load this view</h3><p>{message}</p><button className="button-secondary button-small" type="button" onClick={onRetry}>Try again</button></div>
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="state-panel"><PackageOpen className="state-icon" size={25} aria-hidden="true" /><h3>{title}</h3><p>{detail}</p>{action}</div>
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title-row"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</div>
}