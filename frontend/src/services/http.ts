import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

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
  headers.set('X-Wardrobe-Request', '1')
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await apiClient.request<T>({
      url: path,
      method: init.method ?? 'GET',
      data: init.body,
      headers: Object.fromEntries(headers.entries()),
      signal: init.signal ?? undefined,
    })
    return response.data
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error
    if (!error.response) {
      throw new Error(
        'Could not reach the wardrobe service. Check the connection and try again.',
        { cause: error },
      )
    }

    const { status, data: payload } = error.response
    if (
      status === 401 &&
      !['/auth/login', '/auth/register'].includes(path)
    ) {
      window.dispatchEvent(new Event('wardrobe:session-expired'))
    }
    const body = payload && typeof payload === 'object'
      ? payload as Record<string, unknown>
      : null
    const message = status === 503 && typeof body?.message === 'string'
      ? body.message
      : status >= 500
      ? 'The wardrobe service could not complete this request. Please try again later.'
      : typeof body?.message === 'string'
      ? body.message
      : typeof body?.error === 'string'
        ? body.error
        : `The request could not be completed (HTTP ${status}).`
    throw new ApiError(message, status)
  }
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value)
}