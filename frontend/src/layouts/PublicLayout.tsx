import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogIn, Menu, X, LayoutDashboard } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { publicNav, homeFor } from '@/routes/navigation'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  const cta = user ? (
    <ButtonLink to={homeFor(user.role)} size="sm">
      <LayoutDashboard className="size-4" aria-hidden /> Dashboard
    </ButtonLink>
  ) : (
    <ButtonLink to="/login" size="sm">
      <LogIn className="size-4" aria-hidden /> Login
    </ButtonLink>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink-800 focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="ambient" aria-hidden />
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-4 pr-2 sm:pl-5">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {publicNav.map((n) => (
              <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('rounded-full px-4 py-2 text-sm transition-colors', isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">{cta}</div>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} className="grid size-10 place-items-center rounded-full text-slate-200 hover:bg-white/10 md:hidden">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-menu" aria-label="Mobile" onClick={() => setOpen(false)} className="glass-strong page-enter mx-auto mt-2 max-w-6xl rounded-3xl bg-ink-900/90 p-3 md:hidden">
            {publicNav.map((n) => (
              <NavLink key={n.to} to={n.to} end className={({ isActive }) => cn('block rounded-2xl px-4 py-3 text-base', isActive ? 'bg-white/10 text-white' : 'text-slate-300')}>
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-white/10 p-1 pt-3 sm:hidden">{cta}</div>
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <footer className="px-4 pb-8 pt-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 border-t border-white/8 pt-8 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-slate-500">AI-assisted CCTV workplace intelligence. Demo interface — all data shown is fictional.</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {publicNav.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
