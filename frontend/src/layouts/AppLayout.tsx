import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FloatingNavigation } from '@/components/layout/FloatingNavigation'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/context/AuthContext'
import { appNav } from '@/routes/navigation'

/** Authenticated shell. Always rendered inside a RequireRole guard, so `user` is set. */
export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (!user) return null
  const logout = () => {
    signOut()
    navigate('/', { replace: true })
  }
  return (
    <div className="min-h-dvh">
      <div className="ambient" aria-hidden />
      <FloatingNavigation items={appNav[user.role]} onLogout={logout} />
      <div className="px-4 pb-32 pt-4 sm:px-6 md:pb-10 md:pl-[116px] md:pr-6 lg:pr-8">
        <div className="mx-auto max-w-7xl">
          <TopBar user={user} onLogout={logout} />
          <main id="main" key={pathname} className="page-enter">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
