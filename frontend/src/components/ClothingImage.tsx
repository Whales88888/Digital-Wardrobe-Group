import { useState } from 'react'
import { Shirt } from 'lucide-react'

function isReservedExampleUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'example.com' || hostname.endsWith('.example.com')
  } catch {
    return false
  }
}

export default function ClothingImage({ src, alt, className = '', size = 34 }: { src?: string | null; alt: string; className?: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed || isReservedExampleUrl(src)) {
    return <span className={`image-fallback ${className}`} role="img" aria-label={alt || 'Clothing image unavailable'}><Shirt size={size} aria-hidden="true" /></span>
  }

  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}