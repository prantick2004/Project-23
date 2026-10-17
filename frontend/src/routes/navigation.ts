import { Activity, BarChart3, CalendarCheck, Camera, History, LayoutDashboard, Settings, ShieldAlert, UserRound, Users, type LucideIcon } from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const publicNav: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/contact', label: 'Contact' },
]

export const appNav: Record<Role, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/cameras', label: 'CCTV', icon: Camera },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/admin/incidents', label: 'Incidents', icon: ShieldAlert },
    { to: '/admin/reports', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  employee: [
    { to: '/employee', label: 'Overview', icon: Activity, end: true },
    { to: '/employee/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/employee/history', label: 'History', icon: History },
    { to: '/employee/profile', label: 'Profile', icon: UserRound },
  ],
}

export const homeFor = (role: Role) => (role === 'admin' ? '/admin' : '/employee')
