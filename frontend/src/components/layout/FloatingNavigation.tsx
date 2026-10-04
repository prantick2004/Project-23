import { NavLink } from 'react-router-dom'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { LogOut, MoreHorizontal } from 'lucide-react'
import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/routes/navigation'

interface Props {
  items: NavItem[]
  onLogout: () => void
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn('group relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[10px] font-medium transition-all duration-300', isActive ? 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'text-slate-400 hover:bg-white/6 hover:text-white')

/** iPad-inspired navigation: floating glass rail (md+) and floating bottom dock (mobile). */
export function FloatingNavigation({ items, onLogout }: Props) {
  const dockItems = items.slice(0, 4)
  const overflow = items.slice(4)
  return (
    <>
      {/* Rail: tablet + desktop */}
      <nav aria-label="Application" className="glass-strong fixed bottom-4 left-4 top-4 z-30 hidden w-[76px] flex-col items-center rounded-[28px] py-4 md:flex">
        <LogoMark className="mb-3 h-12" />
        <ul className="flex w-full flex-1 flex-col gap-1.5 overflow-y-auto px-2">
          {items.map((it) => (
            <li key={it.to}>
              <NavLink to={it.to} end={it.end} className={linkCls} title={it.label}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-sky-300" aria-hidden />}
                    <it.icon className={cn('size-5 transition-transform duration-300 group-hover:scale-110', isActive && 'text-sky-200')} aria-hidden />
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <button onClick={onLogout} className="mt-2 flex w-[60px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-rose-300/10 hover:text-rose-200">
          <LogOut className="size-5" aria-hidden />
          Logout
        </button>
      </nav>

      {/* Dock: mobile */}
      <nav aria-label="Application" className="glass-strong fixed inset-x-3 bottom-3 z-30 rounded-[26px] p-1.5 md:hidden" style={{ paddingBottom: 'calc(.375rem + env(safe-area-inset-bottom))' }}>
        <ul className="flex items-stretch justify-between">
          {dockItems.map((it) => (
            <li key={it.to} className="flex-1">
              <NavLink to={it.to} end={it.end} className={linkCls}>
                {({ isActive }) => (
                  <>
                    <it.icon className={cn('size-5', isActive && 'text-sky-200')} aria-hidden />
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <Menu.Root>
              <Menu.Trigger className="flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[10px] font-medium text-slate-400 hover:text-white" aria-label="More">
                <MoreHorizontal className="size-5" aria-hidden />
                <span>More</span>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Content side="top" align="end" sideOffset={10} className="glass-strong z-50 min-w-44 rounded-2xl bg-ink-900/95 p-1.5">
                  {overflow.map((it) => (
                    <Menu.Item key={it.to} asChild>
                      <NavLink to={it.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none data-[highlighted]:bg-white/10">
                        <it.icon className="size-4" aria-hidden /> {it.label}
                      </NavLink>
                    </Menu.Item>
                  ))}
                  <Menu.Item onSelect={onLogout} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-200 outline-none data-[highlighted]:bg-rose-300/10">
                    <LogOut className="size-4" aria-hidden /> Logout
                  </Menu.Item>
                </Menu.Content>
              </Menu.Portal>
            </Menu.Root>
          </li>
        </ul>
      </nav>
    </>
  )
}
