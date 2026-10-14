import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/wardrobe'

export default function PasswordResetPage({ mode }: { mode: 'request' | 'reset' }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      if (mode === 'request') {
        await authApi.forgotPassword(String(form.get('email') ?? '').trim())
        setMessage('If an account exists for that email, a reset link will be sent.')
      } else {
        const password = String(form.get('password') ?? '')
        if (password !== String(form.get('confirm_password') ?? '')) {
          setError('The passwords do not match.')
          return
        }
        await authApi.resetPassword(token, password)
        setMessage('Password reset. You can now sign in with your new password.')
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not complete the request.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-card" aria-labelledby="reset-title">
      <span className="eyebrow">Account recovery</span>
      <h1 id="reset-title">{mode === 'request' ? 'Reset your password.' : 'Choose a new password.'}</h1>
      <p>{mode === 'request' ? 'Enter your account email. If it is registered, we will send a single-use reset link.' : 'Reset links expire after 30 minutes and can only be used once.'}</p>
      {message && <p className="feedback" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {mode === 'reset' && !token
        ? <p className="form-error" role="alert">This reset link is missing its token. Request a new link.</p>
        : <form onSubmit={(event) => void submit(event)}>
          {mode === 'request'
            ? <label className="form-field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
            : <>
              <label className="form-field"><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
              <label className="form-field"><span>Confirm new password</span><input name="confirm_password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
            </>}
          <button className="button-primary auth-submit" type="submit" disabled={busy || (mode === 'reset' && !token)}>
            {busy ? 'Please wait…' : mode === 'request' ? 'Send reset link' : 'Reset password'}
          </button>
        </form>}
      <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
    </section>
  </main>
}
