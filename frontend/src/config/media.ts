/**
 * Central media references. The login background video lives in `public/videos/` and is served
 * as-is (never processed). If the file is missing or fails to load, the page shows the illustrated
 * fallback automatically. To swap the video, replace `public/videos/cctv_login_vidoe.mp4`.
 */
const base = import.meta.env.BASE_URL

export const authVideo = {
  sources: [{ src: `${base}videos/cctv_login_vidoe.mp4`, type: 'video/mp4' }],
  /** Optional still shown for reduced-motion users, e.g. `${base}videos/<poster>.jpg`. */
  poster: undefined as string | undefined,
}
