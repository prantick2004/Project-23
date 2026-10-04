import { Link } from 'react-router-dom'
import { brand } from '@/config/brand'
import { CompanyLogoMark } from '@/components/brand/CompanyLogo'

/** Logo image only (rails, compact bars). Size with a height class, e.g. "h-10". */
export function LogoMark({ className = 'h-9' }: { className?: string }) {
  return <CompanyLogoMark className={className} />
}

/** Logo + name, linked home (public header/footer). */
export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
      <CompanyLogoMark className="h-11" />
      <span className="text-[17px] font-semibold tracking-tight text-white">{brand.name}</span>
    </Link>
  )
}
