import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useResource } from './useResource'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

describe('useResource', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes resources on tab focus and polls for changes from other sessions', () => {
    vi.mocked(useQuery).mockImplementation(() => {
      throw new Error('useQuery mock result is not needed for this test')
    })
    const load = vi.fn().mockResolvedValue([])
    const queryKey = ['wardrobe', 'clothing'] as const

    expect(() => useResource(queryKey, load)).toThrow(
      'useQuery mock result is not needed for this test',
    )
    expect(useQuery).toHaveBeenCalledWith({
      queryKey,
      queryFn: load,
      refetchOnWindowFocus: true,
      refetchInterval: 15_000,
    })
  })
})
