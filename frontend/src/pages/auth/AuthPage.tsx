import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, IdCard, Info, KeyRound, Mail, Phone, User } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthCard } from '@/components/auth/AuthCard'
import { AuthInput } from '@/components/auth/AuthInput'
import { AppleIcon, AuthButton, GoogleIcon, SocialButton } from '@/components/auth/AuthButton'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services'
import { homeFor } from '@/routes/navigation'

type View = 'employee-signin' | 'admin-signin' | 'employee-signup'
type Errors = Record<string, string>

const rules = {
  name: (v: string) => (v.trim().length < 2 ? 'Enter your full name.' : ''),
  first: (v: string) => (v.trim().length < 1 ? 'Required.' : ''),
  employeeId: (v: string) => (/^[A-Za-z]{2,4}-?\d{3,6}$/.test(v.trim()) ? '' : 'Use the format EMP-1001.'),
  email: (v: string) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  phone: (v: string) => (/^[+\d][\d\s()-]{6,18}$/.test(v.trim()) ? '' : 'Enter a valid phone number.'),
  secretKey: (v: string) => (v.trim().length < 8 ? 'Secret key must be at least 8 characters.' : ''),
} as const

const fieldRules: Record<View, Record<string, keyof typeof rules>> = {
  'employee-signin': { name: 'name', employeeId: 'employeeId', email: 'email', phone: 'phone' },
  'admin-signin': { name: 'name', employeeId: 'employeeId', email: 'email', secretKey: 'secretKey' },
  'employee-signup': { firstName: 'first', lastName: 'first', employeeId: 'employeeId', email: 'email', phone: 'phone' },
}

const copy: Record<View, { title: string; sub: string; cta: string }> = {
  'employee-signin': { title: 'Welcome Back', sub: 'Sign in to your account to continue', cta: 'Login' },
  'admin-signin': { title: 'Welcome Back', sub: 'Sign in to your account to continue', cta: 'Login' },
  'employee-signup': { title: 'Create Account', sub: 'Register to view your own records', cta: 'Create account' },
}

export default function AuthPage({ view }: { view: View }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const c = copy[view]
  const [forgot, setForgot] = useState(false)

  const validate = (data: FormData) => {
    const out: Errors = {}
    for (const [field, rule] of Object.entries(fieldRules[view])) {
      const msg = rules[rule](String(data.get(field) ?? ''))
      if (msg) out[field] = msg
    }
    return out
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const v = (k: string) => String(f.get(k) ?? '')
    const errs = validate(f)
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) {
      e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setLoading(true)
    try {
      if (view === 'employee-signup') {
        await authService.signUpEmployee({ firstName: v('firstName'), lastName: v('lastName'), employeeId: v('employeeId'), email: v('email'), phone: v('phone') })
        setDone(true)
      } else {
        const user =
          view === 'admin-signin'
            ? await authService.signInAdmin({ name: v('name'), employeeId: v('employeeId'), email: v('email'), secretKey: v('secretKey') })
            : await authService.signInEmployee({ name: v('name'), employeeId: v('employeeId'), email: v('email'), phone: v('phone') })
        signIn(user)
        const from = (location.state as { from?: string } | null)?.from
        navigate(from && from.startsWith(`/${user.role}`) ? from : homeFor(user.role), { replace: true })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const err = (k: string) => errors[k]
  const role = view === 'admin-signin' ? 'admin' : 'employee'

  return (
    <AuthLayout>
      <AuthCard title={done ? 'Request submitted' : c.title} subtitle={done ? 'Your registration is pending review' : c.sub} activeRole={role}>
        {done ? (
          <div role="status" className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-300" aria-hidden />
            <p className="mt-3 text-sm text-slate-200">Demo only: no account was created. In the real system your registration would be reviewed before sign-in is enabled.</p>
            <AuthButton type="button" className="mt-6" onClick={() => navigate('/login')}>Go to sign in</AuthButton>
          </div>
        ) : (
          <>
            <p className="mb-3 flex gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[11px] leading-snug text-sky-100">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Demo mode — not real authentication.{' '}
                {view === 'employee-signin' && <>Try Employee ID <b>EMP-1007</b> with email <b>omar.haddad@example.test</b>.</>}
                {view === 'admin-signin' && <>Any well-formed details work; nothing is verified or stored. Admin accounts are provisioned, not self-registered.</>}
                {view === 'employee-signup' && <>No account is created and nothing is sent.</>}
              </span>
            </p>
            {formError && (
              <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-100"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}</p>
            )}
            <form onSubmit={onSubmit} noValidate className="space-y-3" key={view}>
              {view === 'employee-signup' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthInput label="First Name" name="firstName" autoComplete="given-name" placeholder="Enter first name" error={err('firstName')} icon={<User />} />
                  <AuthInput label="Last Name" name="lastName" autoComplete="family-name" placeholder="Enter last name" error={err('lastName')} icon={<User />} />
                </div>
              ) : (
                <AuthInput label="Name" name="name" autoComplete="name" placeholder="Enter your name" error={err('name')} icon={<User />} />
              )}
              <AuthInput label="Employee ID" name="employeeId" autoComplete="off" placeholder="Enter your employee ID" error={err('employeeId')} icon={<IdCard />} />
              <AuthInput label="Email" name="email" type="email" autoComplete="email" placeholder="Enter your email" error={err('email')} icon={<Mail />} />
              {view !== 'admin-signin' && <AuthInput label="Phone Number" name="phone" type="tel" autoComplete="tel" placeholder="Enter your phone number" error={err('phone')} icon={<Phone />} />}
              {view === 'admin-signin' && <AuthInput label="Secret Key" name="secretKey" type="password" autoComplete="off" placeholder="Enter your secret key" error={err('secretKey')} icon={<KeyRound />} />}

              {view !== 'employee-signup' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2.5 text-white">
                    <input type="checkbox" name="remember" className="size-[18px] cursor-pointer rounded accent-sky-400" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgot((f) => !f)} aria-expanded={forgot} className="text-xs font-semibold text-sky-400 hover:underline">Forgot password?</button>
                </div>
              )}
              {forgot && <p role="status" className="rounded-xl bg-white/5 p-3 text-xs text-slate-200">Recovery isn’t available in this demo. In the real system, please contact your administrator.</p>}

              <AuthButton type="submit" loading={loading}>{loading ? 'Please wait…' : c.cta}</AuthButton>
            </form>

            <div className="my-3 flex items-center gap-4 text-xs text-slate-300"><span className="h-px flex-1 bg-white/15" />or continue with<span className="h-px flex-1 bg-white/15" /></div>
            <div className="flex gap-4">
              <SocialButton icon={<GoogleIcon />} short="Google">Continue with Google</SocialButton>
              <SocialButton icon={<AppleIcon />} short="Apple">Continue with Apple</SocialButton>
            </div>

            <p className="mt-3 text-center text-sm text-slate-200 empty:hidden">
              {view === 'employee-signin' && <>New employee? <Link to="/signup" className="font-medium text-sky-400 hover:underline">Create an account</Link></>}
              {view === 'employee-signup' && <>Already registered? <Link to="/login" className="font-medium text-sky-400 hover:underline">Sign in</Link></>}
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
