import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { homeFor } from './navigation'
import type { Role } from '@/types'

/**
 * Client-side route protection for the DEMO session only.
 * Real access control must be enforced by the backend; these guards only
 * decide which UI to render.
 */
export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to={role === 'admin' ? '/login/admin' : '/login'} replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

/** Sends already-signed-in users from auth screens straight to their own dashboard. */
export function RedirectIfAuthed() {
  const { user } = useAuth()
  if (user) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}
