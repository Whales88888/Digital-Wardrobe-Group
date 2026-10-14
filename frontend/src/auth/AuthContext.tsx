import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/wardrobe'
import type { AuthResponse } from '../services/types'
import { ApiError } from '../services/http'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<Error | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    void authApi.session()
      .then((currentSession) => {
        if (active) setSession(currentSession)
      })
      .catch((reason: unknown) => {
        if (active && !(reason instanceof ApiError && reason.status === 401)) {
          setSessionError(reason instanceof Error ? reason : new Error('Could not verify your session.'))
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    function onSessionExpired() {
      queryClient.clear()
      setSession(null)
    }
    window.addEventListener('wardrobe:session-expired', onSessionExpired)
    return () => {
      active = false
      window.removeEventListener('wardrobe:session-expired', onSessionExpired)
    }
  }, [queryClient])

  async function authenticate(createSession: () => Promise<AuthResponse>) {
    const nextSession = await createSession()
    queryClient.clear()
    setSession(nextSession)
    setSessionError(null)
  }

  return <AuthContext.Provider value={{
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.user),
    isLoading,
    sessionError,
    updateUser: (user) => setSession((current) => current ? { ...current, user } : current),
    login: (email, password) => authenticate(() => authApi.login(email, password)),
    register: (name, email, password) => authenticate(() => authApi.register(name, email, password)),
    logout: async () => {
      try {
        await authApi.logout()
      } finally {
        queryClient.clear()
        setSession(null)
        setSessionError(null)
      }
    },
  }}>{children}</AuthContext.Provider>
}
