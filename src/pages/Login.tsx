import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react'
import { Page } from '../components/Page'
import { Logo, Wordmark } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export default function Login() {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error
        if (data.session) {
          toast('success', 'Account created! Welcome to Clock It!')
        } else {
          toast('info', 'Almost there! Check your email to confirm your account.')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      // AuthContext + router handle navigation on session change.
    } catch (err) {
      toast('error', (err as Error).message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setGoogleBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (err) {
      toast('error', (err as Error).message || 'Google sign-in failed.')
      setGoogleBusy(false)
    }
  }

  return (
    <Page className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size="lg" />
        <h1 className="mt-5 text-3xl font-black text-lavender-700">
          <Wordmark className="text-3xl" />
        </h1>
        <p className="mt-1 text-[15px] text-lavender-700/70">
          {mode === 'signin' ? 'Welcome back! Clock in and get to work.' : 'Create your account to start tracking.'}
        </p>
      </div>

      <div className="mb-5 flex rounded-2xl bg-lavender-100 p-1">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-bold"
          >
            {mode === m && (
              <motion.span
                layoutId="auth-pill"
                className="absolute inset-0 rounded-xl bg-surface shadow-card"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${mode === m ? 'text-lavender-700' : 'text-lavender-400'}`}>
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <Field icon={<UserIcon size={18} />}>
            <input
              className="input pl-11"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </Field>
        )}
        <Field icon={<Mail size={18} />}>
          <input
            className="input pl-11"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field icon={<Lock size={18} />}>
          <input
            className="input pl-11 pr-11"
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lavender-300 hover:text-lavender-500"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </Field>

        <button className="btn-primary w-full !mt-5" disabled={busy}>
          {busy ? <Spinner size={18} /> : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-lavender-300">
        <span className="h-px flex-1 bg-lavender-200" />
        OR
        <span className="h-px flex-1 bg-lavender-200" />
      </div>

      <button className="btn-ghost w-full" onClick={google} disabled={googleBusy}>
        {googleBusy ? <Spinner size={18} /> : <GoogleIcon />}
        Continue with Google
      </button>
    </Page>
  )
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lavender-300">
        {icon}
      </span>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
