import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: ReactNode
  error?: string
}

/** Labelled input in the reference style. type="password" gets a visibility toggle. */
export function AuthInput({ label, icon, error, type, className, ...rest }: Props) {
  const id = useId()
  const [show, setShow] = useState(false)
  const secret = type === 'password'
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-slate-200 [&>svg]:size-[18px]">{icon}</span>
        <input
          id={id}
          type={secret && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cn('h-11 w-full rounded-[10px] border bg-white/[.06] pl-11 text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-md placeholder:text-slate-300/55 transition-all duration-200 hover:border-white/30 focus:border-sky-300/70 focus:bg-white/[.09] focus:shadow-[0_0_0_3px_rgba(56,189,248,.15),inset_0_1px_0_rgba(255,255,255,.1)] focus:outline-none', secret ? 'pr-11' : 'pr-4', error ? 'border-rose-300/70' : 'border-white/[.16]')}
          {...rest}
        />
        {secret && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? `Hide ${label}` : `Show ${label}`} aria-pressed={show} className="absolute inset-y-0 right-2 my-auto grid size-9 place-items-center rounded-lg text-slate-200 hover:text-white">
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-200"><AlertCircle className="size-3.5" aria-hidden />{error}</p>
      )}
    </div>
  )
}
