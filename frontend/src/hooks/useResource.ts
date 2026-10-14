import { useQuery } from '@tanstack/react-query'

export interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  retry: () => void
}

export function useResource<T>(
  queryKey: readonly unknown[],
  load: () => Promise<T>,
): ResourceState<T> {
  const query = useQuery({ queryKey, queryFn: load })
  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error('Something went wrong.') : null,
    retry: () => { void query.refetch() },
  }
}