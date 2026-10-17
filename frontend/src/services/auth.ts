/**
 * DEMO AUTHENTICATION — NOT REAL SECURITY.
 *
 * This only validates the shape of the input and fabricates a client-side
 * session so the role-based UI can be previewed. Nothing here is verified by a
 * server, and no secret is stored or compared. Replace `authService` with a
 * real implementation (server-issued, httpOnly-cookie or token session) when
 * the backend is connected. Route guards read from `AuthContext`, which only
 * depends on the `AuthService` interface below.
 */
import { mockLatency, ServiceError } from '@/api/client'
import { EMPLOYEES } from '@/data/mock'
import type { SessionUser } from '@/types'

export interface AdminCredentials {
  name: string
  employeeId: string
  email: string
  secretKey: string
}
export interface EmployeeCredentials {
  name: string
  employeeId: string
  email: string
  phone: string
}
export interface EmployeeSignUp {
  firstName: string
  lastName: string
  employeeId: string
  email: string
  phone: string
}

export interface AuthService {
  signInAdmin(c: AdminCredentials): Promise<SessionUser>
  signInEmployee(c: EmployeeCredentials): Promise<SessionUser>
  signUpEmployee(c: EmployeeSignUp): Promise<{ pendingApproval: true }>
  restore(): SessionUser | null
  persist(user: SessionUser | null): void
}

const STORAGE_KEY = 'si.demo-session'
const norm = (s: string) => s.trim().toLowerCase()

export const authService: AuthService = {
  async signInAdmin(c) {
    // DEMO: any well-formed input signs in; the secret key is never stored or compared.
    await mockLatency(null, 800)
    if (c.secretKey.trim().length < 8) throw new ServiceError('Invalid credentials.', 'unauthorized')
    return { id: 'admin-demo', role: 'admin', name: c.name.trim(), employeeId: c.employeeId.trim().toUpperCase(), email: c.email.trim() }
  },
  async signInEmployee(c) {
    await mockLatency(null, 800)
    const match = EMPLOYEES.find((e) => norm(e.employeeId) === norm(c.employeeId))
    if (!match || norm(match.email) !== norm(c.email)) {
      throw new ServiceError('We could not match those details to an employee account.', 'unauthorized')
    }
    return {
      id: match.id,
      role: 'employee',
      name: `${match.firstName} ${match.lastName}`,
      employeeId: match.employeeId,
      email: match.email,
    }
  },
  async signUpEmployee(c) {
    await mockLatency(null, 900)
    if (EMPLOYEES.some((e) => norm(e.employeeId) === norm(c.employeeId))) {
      throw new ServiceError('An account for this Employee ID already exists.', 'validation')
    }
    return { pendingApproval: true }
  },
  restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SessionUser) : null
    } catch {
      return null
    }
  },
  persist(user) {
    try {
      if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable: session lasts for this page view only */
    }
  },
}
