import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, User, UsersRound } from 'lucide-react'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { brand } from '@/config/brand'
import { cn } from '@/utils/cn'

interface Props {
  title: string
  subtitle: string
  activeRole: 'admin' | 'employee'
  children: ReactNode
}

/** The tall rounded glass card. Role tabs are real links so routing/back-button keep working. */
export function AuthCard({ title, subtitle, activeRole, children }: Props) {
  const tabs = [
    { role: 'admin' as const, to: '/login/admin', label: 'Admin Login', Icon: User },
    { role: 'employee' as const, to: '/login', label: 'Employee Login', Icon: UsersRound },
  ]
  return (
    <section aria-labelledby="auth-title" className="flex w-full max-w-[583px] flex-col relative rounded-[28px] border border-white/[.14] bg-gradient-to-br from-white/[.11] via-white/[.05] to-white/[.03] px-5 py-8 shadow-[0_30px_80px_-24px_rgba(2,6,40,.85),inset_0_1px_0_rgba(255,255,255,.22),inset_0_0_0_1px_rgba(125,170,255,.06)] backdrop-blur-2xl backdrop-saturate-150 sm:px-9 lg:justify-between lg:px-[8.6%] lg:py-7">
      <div>
        <CompanyLogo size="md" align="center" className="hidden lg:flex" />
        <h1 id="auth-title" className="mt-0 text-center text-[1.75rem] font-semibold tracking-tight sm:text-[2rem] lg:mt-3">{title}</h1>
        <p className="mt-1 text-center text-[15px] text-slate-200/90 sm:text-base">{subtitle}</p>

        <nav aria-label="Account type" className="mt-5 grid grid-cols-2 rounded-full border border-white/10 bg-white/[.05] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,.25)] sm:mt-7">
          {tabs.map(({ role, to, label, Icon }) => {
            const active = role === activeRole
            return (
              <Link key={role} to={to} aria-current={active ? 'page' : undefined} className={cn('flex h-[42px] items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-300 sm:h-[46px] sm:text-[15px]', active ? 'bg-gradient-to-r from-blue-500/90 to-cyan-400/90 text-white shadow-[0_6px_22px_-6px_rgba(56,189,248,.75),inset_0_1px_0_rgba(255,255,255,.35)]' : 'text-slate-200/90 hover:bg-white/[.07] hover:text-white')}>
                <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-4">{children}</div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
          <ShieldCheck className="size-8 shrink-0 text-sky-400" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-xs font-semibold">Secure Access</p>
            <p className="text-[11px] text-slate-300">Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-300/80">{brand.copyright}</p>
      </div>
    </section>
  )
}
