import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 pt-44 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Page not found</h1>
      <p className="mt-3 text-slate-400">The page you’re looking for doesn’t exist or has moved.</p>
      <ButtonLink to="/" className="mt-8">Back to home</ButtonLink>
    </section>
  )
}
