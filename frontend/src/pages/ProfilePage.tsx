import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { PageHeading } from '../components/States'
import { authApi, userApi } from '../services/wardrobe'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const updated = await userApi.updateProfile({
        name: String(form.get('name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
      })
      updateUser(updated)
      setProfileMessage('Your profile has been updated.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update your profile.')
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = String(form.get('current_password') ?? '')
    const newPassword = String(form.get('new_password') ?? '')
    if (newPassword !== String(form.get('confirm_password') ?? '')) {
      setError('The new password and confirmation do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await authApi.changePassword(currentPassword, newPassword)
      formElement.reset()
      setPasswordMessage('Password changed. Sign in again with the new password.')
      window.dispatchEvent(new Event('wardrobe:session-expired'))
      navigate('/login', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not change your password.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <PageHeading eyebrow="Your account" title="Profile and security" description="Update your account details or change your password." />
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="activity-grid">
      <section className="dashboard-section activity-panel">
        <h3>Profile details</h3>
        {profileMessage && <p className="feedback" role="status">{profileMessage}</p>}
        <form className="planner-form" onSubmit={(event) => void updateProfile(event)}>
          <label className="form-field"><span>Name</span><input name="name" required maxLength={100} defaultValue={user?.name ?? ''} /></label>
          <label className="form-field"><span>Email</span><input name="email" type="email" required maxLength={255} defaultValue={user?.email ?? ''} /></label>
          <p className="table-row-subtitle">Role: {user?.role}</p>
          <button className="button-primary button-small" type="submit" disabled={busy}>Save profile</button>
        </form>
      </section>
      <section className="dashboard-section activity-panel">
        <h3>Change password</h3>
        {passwordMessage && <p className="feedback" role="status">{passwordMessage}</p>}
        <form className="planner-form" onSubmit={(event) => void changePassword(event)}>
          <label className="form-field full"><span>Current password</span><input name="current_password" type="password" autoComplete="current-password" required maxLength={72} /></label>
          <label className="form-field"><span>New password</span><input name="new_password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>
          <label className="form-field"><span>Confirm new password</span><input name="confirm_password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>
          <p className="table-row-subtitle">Changing your password signs out all active sessions.</p>
          <button className="button-primary button-small" type="submit" disabled={busy}>Change password</button>
        </form>
      </section>
    </div>
  </>
}
