import { useEffect, useState } from 'react'

export interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  retry: () => void
}

export function useResource<T>(load: () => Promise<T>): ResourceState<T> {
  const [state, setState] = useState<Omit<ResourceState<T>, 'retry'>>({
    data: null,
    loading: true,
    error: null,
  })
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    load()
      .then((result) => {
        if (active) setState({ data: result, loading: false, error: null })
      })
      .catch((reason: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: reason instanceof Error ? reason : new Error('Something went wrong.'),
          })
        }
      })

    return () => {
      active = false
    }
  }, [load, revision])

  return {
    ...state,
    retry: () => {
      setState((current) => ({ ...current, loading: true, error: null }))
      setRevision((value) => value + 1)
    },
  }
}