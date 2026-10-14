import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { isAuthenticated, isLoading, sessionError, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'

  if (isLoading) {
    return <main className="auth-page"><p>Checking your session…</p></main>
  }
  if (isAuthenticated) {
    return <main className="auth-page"><p>You are already signed in. <Link to="/app/dashboard">Open your wardrobe</Link>.</p></main>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    try {
      if (isRegister) {
        await register(String(form.get('name') ?? '').trim(), email, password)
      } else {
        await login(email, password)
      }
      navigate(returnTo, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="auth-title">
      <span className="eyebrow">{isRegister ? 'Start a personal collection' : 'Welcome back'}</span>
      <h1 id="auth-title">{isRegister ? 'Create your account.' : 'Your wardrobe awaits.'}</h1>
      <p>{isRegister ? 'Your collection stays connected to your account.' : 'Sign in to see and manage your collection.'}</p>
      {sessionError && <p className="form-error" role="alert">{sessionError.message}</p>}
      <form onSubmit={submit}>
        {isRegister && <label className="form-field"><span>Name</span><input name="name" autoComplete="name" maxLength={100} required /></label>}
        <label className="form-field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
        <label className="form-field">
          <div className="form-field-header">
            <span>Password</span>
            {!isRegister && <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>}
          </div>
          <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} maxLength={72} required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Digital Wardrobe?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
    </section>
  </main>
}
