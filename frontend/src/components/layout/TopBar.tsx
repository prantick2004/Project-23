import { Link } from 'react-router-dom'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronDown, Lock, LogOut, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { LogoMark } from '@/components/ui/Logo'
import { useAsync } from '@/hooks/useAsync'
import { getNotifications } from '@/services'
import { timeAgo } from '@/utils/format'
import type { SessionUser } from '@/types'

export function TopBar({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const notes = useAsync(getNotifications)
  const unread = notes.data?.filter((n) => !n.read).length ?? 0
  const profilePath = user.role === 'admin' ? '/admin/settings' : '/employee/profile'
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <LogoMark className="h-9 md:hidden" />
        <p className="glass hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-slate-300 sm:flex">
          <Lock className="size-3.5 text-emerald-200" aria-hidden /> Private Monitoring Environment
        </p>
        <span className="sm:hidden text-xs text-slate-400 flex items-center gap-1.5">
          <Lock className="size-3 text-emerald-200" aria-hidden /> Private
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="glass hidden rounded-full px-3 py-1.5 text-xs font-medium capitalize text-sky-200 sm:inline">{user.role}</span>

        <Menu.Root>
          <Menu.Trigger aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="glass relative grid size-10 place-items-center rounded-full text-slate-200 hover:text-white">
            <Bell className="size-[18px]" aria-hidden />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sky-300 ring-2 ring-ink-900" aria-hidden />}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={10} className="glass-strong z-50 w-80 max-w-[calc(100vw-2rem)] rounded-3xl bg-ink-900/95 p-2">
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-slate-400">Notifications</p>
              {notes.data?.map((n) => (
                <Menu.Item key={n.id} className="rounded-2xl px-3 py-2.5 outline-none data-[highlighted]:bg-white/8">
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-300" aria-hidden />}
                    <div>
                      <p className="text-sm text-white">{n.title}</p>
                      <p className="text-xs text-slate-400">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{timeAgo(n.time)}</p>
                    </div>
                  </div>
                </Menu.Item>
              ))}
              {!notes.data?.length && <p className="px-3 py-4 text-sm text-slate-400">You’re all caught up.</p>}
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>

        <Menu.Root>
          <Menu.Trigger className="glass flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-slate-100" aria-label="Account menu">
            <Avatar name={user.name} size="sm" />
            <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
            <ChevronDown className="size-3.5 text-slate-400" aria-hidden />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={10} className="glass-strong z-50 w-56 rounded-3xl bg-ink-900/95 p-1.5">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs capitalize text-slate-400">{user.role} · {user.employeeId}</p>
              </div>
              <Menu.Separator className="my-1 h-px bg-white/10" />
              <Menu.Item asChild>
                <Link to={profilePath} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none data-[highlighted]:bg-white/10">
                  <UserRound className="size-4" aria-hidden /> {user.role === 'admin' ? 'Settings' : 'My profile'}
                </Link>
              </Menu.Item>
              <Menu.Item onSelect={onLogout} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-200 outline-none data-[highlighted]:bg-rose-300/10">
                <LogOut className="size-4" aria-hidden /> Logout
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  )
}
