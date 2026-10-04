import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { AuthFloatingPanels, AuthScene } from './AuthScene'
import { AuthBranding } from './AuthBranding'
import { LiveBadge } from './LiveBadge'
import { VideoBackground } from './VideoBackground'
import { useBackgroundVideo } from '@/hooks/useBackgroundVideo'

/** Split-screen auth shell: video/illustration hero (left) + glass form (right). Stacks on tablet/mobile. */
export function AuthLayout({ children }: { children: ReactNode }) {
  const video = useBackgroundVideo()
  const showVideoUi = video.mode === 'video'
  return (
    <div className="font-auth min-h-dvh bg-[#070d3d] text-white lg:grid lg:grid-cols-2">
      {/* Left: background layer → overlay → branding/text */}
      <aside data-auth-bg={video.mode} className="relative isolate flex min-h-[19rem] flex-col justify-between overflow-hidden px-6 pb-8 pt-7 sm:min-h-[22rem] sm:px-10 lg:sticky lg:top-0 lg:h-dvh lg:px-[4.2%] lg:pb-[5.2%] lg:pt-[2.4%]">
        <VideoBackground mode={video.mode} onFail={video.markFailed} fallback={<><AuthScene /><div className="absolute inset-0 hidden lg:block"><AuthFloatingPanels /></div></>} />
        <div className="relative flex items-start justify-between gap-4">
          <CompanyLogo size="lg" />
          <div className="flex items-start gap-4">
            {showVideoUi && <div className="hidden lg:block"><LiveBadge /></div>}
            <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-slate-100/90 hover:text-white lg:hidden">Back to website <ArrowUpRight className="size-4" aria-hidden /></Link>
          </div>
        </div>
        <AuthBranding />
      </aside>

      {/* Right: layered glass over soft light */}
      <main id="main" className="relative isolate flex flex-col overflow-hidden bg-gradient-to-b from-[#0a1450] via-[#0a1244] to-[#070d3d] px-4 pb-10 pt-0 sm:px-8 lg:px-[5%] lg:py-[2.4%]">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -right-24 top-[8%] size-[26rem] rounded-full bg-indigo-500/30 blur-[110px]" />
          <div className="absolute -left-20 top-[48%] size-[22rem] rounded-full bg-sky-500/20 blur-[110px]" />
          <div className="absolute bottom-[-6rem] right-[12%] size-[20rem] rounded-full bg-violet-500/25 blur-[110px]" />
          <div className="absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
        </div>
        <Link to="/" className="relative z-10 mb-3 ml-auto hidden items-center gap-2 text-sm text-slate-100 hover:text-white lg:inline-flex">Back to website <ArrowUpRight className="size-4" aria-hidden /></Link>
        <div className="relative z-10 -mt-6 flex flex-1 items-start justify-center lg:mt-0 lg:items-stretch">{children}</div>
      </main>
    </div>
  )
}
