import { useEffect, useRef, type ReactNode } from 'react'
import { authVideo } from '@/config/media'
import type { BackgroundMode } from '@/hooks/useBackgroundVideo'

interface Props {
  mode: BackgroundMode
  onFail: (reason: string) => void
  /** Rendered only when the video cannot be shown at all (no source, load error, undecodable file). */
  fallback: ReactNode
}

/**
 * Looping, muted background video with blue cinematic overlays. One <video> element only.
 * Layers (back to front): video → blue tint → gradient → vignette.
 */
export function VideoBackground({ mode, onFail, fallback }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const paused = mode === 'video-paused'

  useEffect(() => {
    const v = ref.current
    if (!v || mode === 'illustration') return
    v.muted = true // React doesn't reliably reflect the muted attribute; autoplay needs it
    if (paused) {
      v.pause()
      return
    }
    const start = () => v.play().catch(() => undefined) // blocked/aborted play() is NOT a load failure
    start()
    // If the browser blocked autoplay, retry on the first user gesture.
    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    const retry = () => {
      if (v.paused) start()
      events.forEach((e) => window.removeEventListener(e, retry))
    }
    events.forEach((e) => window.addEventListener(e, retry, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, retry))
  }, [mode, paused])

  if (mode === 'illustration') return <>{fallback}</>

  const failed = (e: React.SyntheticEvent<HTMLVideoElement | HTMLSourceElement>) => {
    const el = e.currentTarget
    const media = el instanceof HTMLVideoElement ? el : el.parentElement instanceof HTMLVideoElement ? el.parentElement : null
    onFail(media?.error ? `media error ${media.error.code} (${media.error.message || 'cannot load or decode the file'})` : 'video file could not be loaded')
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#081046]" aria-hidden>
      <video ref={ref} className="absolute inset-0 size-full object-cover" autoPlay={!paused} muted loop playsInline preload="auto" poster={authVideo.poster} disablePictureInPicture controls={false} onError={failed}>
        {authVideo.sources.map((s) => (
          // #t=0.1 makes the browser render a real frame while paused (reduced motion)
          <source key={s.src} src={paused ? `${s.src}#t=0.1` : s.src} type={s.type} onError={failed} />
        ))}
      </video>
      <div className="absolute inset-0 bg-[#0a1a6b]/30 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1f8a]/35 via-transparent to-[#5b2bb5]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#060d3a]/92 via-[#060d3a]/15 to-[#060d3a]/25" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgba(4,8,40,.55)_100%)]" />
    </div>
  )
}
