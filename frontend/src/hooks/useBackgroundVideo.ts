import { useEffect, useState } from 'react'
import { authVideo } from '@/config/media'

const reducedQuery = '(prefers-reduced-motion: reduce)'

export type BackgroundMode = 'video' | 'video-paused' | 'illustration'

/**
 * Decides how the login background renders:
 *  - video:        autoplaying loop
 *  - video-paused: the real video frozen on its first frame (reduced motion)
 *  - illustration: only when no source exists or the file genuinely fails to load/decode
 * A rejected play() (autoplay policy) never switches to the illustration.
 */
export function useBackgroundVideo() {
  const [failure, setFailure] = useState<string | null>(null)
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(reducedQuery).matches)
  useEffect(() => {
    const mq = window.matchMedia(reducedQuery)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const hasSources = authVideo.sources.length > 0
  const showVideo = hasSources && !failure
  const mode: BackgroundMode = !showVideo ? 'illustration' : reduced ? 'video-paused' : 'video'
  const markFailed = (reason: string) => {
    console.warn(`[auth-video] showing illustration fallback: ${reason}`)
    setFailure(reason)
  }
  return { mode, reduced, markFailed, failure }
}
