import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { AlertCircle, Eye, EyeOff, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const control =
  'w-full rounded-xl border border-white/10 bg-white/[.04] px-3.5 text-sm text-white placeholder:text-slate-500 transition-colors hover:border-white/20 focus:border-sky-300/50 focus:bg-white/[.06]'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export function Field({ label, error, hint, icon, className, type, ...rest }: FieldProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isSecret = type === 'password'
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-slate-500">{icon}</span>}
        <input
          id={id}
          type={isSecret && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(control, 'h-11', icon && 'pl-10', isSecret && 'pr-11', error && 'border-rose-300/50')}
          {...rest}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
            aria-pressed={show}
            className="absolute inset-y-0 right-2 my-auto grid size-8 place-items-center rounded-lg text-slate-400 hover:text-white"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-200">
          <AlertCircle className="size-3.5" aria-hidden /> {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function TextArea({ label, error, className, ...rest }: { label: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn(control, 'min-h-32 resize-y py-3', error && 'border-rose-300/50')} {...rest} />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-200">
          <AlertCircle className="size-3.5" aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search…', label = 'Search' }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(control, 'h-10 pl-10')} />
    </div>
  )
}

export function Select({ label, className, children, ...rest }: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select aria-label={label} className={cn(control, 'h-10 w-auto cursor-pointer pr-8 [&>option]:bg-ink-800', className)} {...rest}>
      {children}
    </select>
  )
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div role="search" className="mb-5 flex flex-wrap items-center gap-2.5">
      {children}
    </div>
  )
}

export function SegmentedControl<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="glass inline-flex rounded-full p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-full px-3.5 py-1.5 text-sm transition-all', value === o.value ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
