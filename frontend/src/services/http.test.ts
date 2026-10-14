import { AxiosHeaders, type AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, ApiError, request } from './http'

describe('Axios API client', () => {
  const dispatchEvent = vi.fn()
  let requestSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    dispatchEvent.mockReset()
    vi.stubGlobal('window', { dispatchEvent })
    requestSpy = vi.spyOn(apiClient, 'request')
  })

  afterEach(() => {
    requestSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('sends cookies and the CSRF header with JSON requests', async () => {
    requestSpy.mockResolvedValue({ data: { saved: true } })

    await expect(
      request<{ saved: boolean }>('/clothing', {
        method: 'POST',
        body: JSON.stringify({ name: 'Coat' }),
      }),
    ).resolves.toEqual({ saved: true })

    const [config] = requestSpy.mock.calls[0]
    expect(apiClient.defaults.withCredentials).toBe(true)
    expect(config.method).toBe('POST')
    const headers = AxiosHeaders.from(config.headers)
    expect(headers.get('X-Wardrobe-Request')).toBe('1')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('leaves multipart content type to the browser and Axios adapter', async () => {
    requestSpy.mockResolvedValue({ data: {} })
    const body = new FormData()
    body.set('image', new Blob(['image bytes'], { type: 'image/png' }), 'image.png')

    await request('/clothing/images', { method: 'POST', body })

    const [config] = requestSpy.mock.calls[0]
    expect(config.data).toBe(body)
    expect(AxiosHeaders.from(config.headers).has('Content-Type')).toBe(false)
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('notifies the auth provider when a protected request gets a 401', async () => {
    requestSpy.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Session expired' } },
    } as AxiosError)

    await expect(request('/clothing')).rejects.toBeInstanceOf(ApiError)
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'wardrobe:session-expired' }),
    )
  })

  it('does not turn failed authentication into a session-expired event', async () => {
    requestSpy.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Invalid email or password' } },
    } as AxiosError)

    await expect(request('/auth/login', { method: 'POST' })).rejects.toThrow(
      'Invalid email or password',
    )
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('shows a safe service-unavailable message for an unconfigured integration', async () => {
    requestSpy.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 503,
        data: { message: 'Image storage is not configured on this server' },
      },
    } as AxiosError)

    await expect(request('/clothing/images', { method: 'POST' })).rejects.toThrow(
      'Image storage is not configured on this server',
    )
  })

  it('keeps unexpected internal server details hidden', async () => {
    requestSpy.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: { message: 'ER_BAD_FIELD_ERROR: private database detail' },
      },
    } as AxiosError)

    await expect(request('/clothing')).rejects.toThrow(
      'The wardrobe service could not complete this request. Please try again later.',
    )
  })

  it('shows a connection message when Axios cannot reach the API', async () => {
    requestSpy.mockRejectedValue({ isAxiosError: true } as AxiosError)

    await expect(request('/clothing')).rejects.toThrow(
      'Could not reach the wardrobe service. Check the connection and try again.',
    )
  })
})
