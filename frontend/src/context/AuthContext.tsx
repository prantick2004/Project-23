import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services'
import type { SessionUser } from '@/types'

interface AuthContextValue {
  user: SessionUser | null
  signIn: (user: SessionUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => authService.restore())
  const signIn = useCallback((u: SessionUser) => {
    authService.persist(u)
    setUser(u)
  }, [])
  const signOut = useCallback(() => {
    authService.persist(null)
    setUser(null)
  }, [])
  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
