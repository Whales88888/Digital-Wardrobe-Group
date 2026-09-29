const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new Error('Could not reach the wardrobe service. Check the connection and try again.')
  }

  const responseText = await response.text()
  let payload: unknown
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    const body = payload && typeof payload === 'object'
      ? payload as Record<string, unknown>
      : null
    const message = response.status >= 500
      ? 'The wardrobe service could not complete this request. Please try again later.'
      : typeof body?.message === 'string'
      ? body.message
      : typeof body?.error === 'string'
        ? body.error
        : `The request could not be completed (HTTP ${response.status}).`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value)
}