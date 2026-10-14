import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ErrorState, LoadingState, PageHeading } from '../components/States'
import { useResource } from '../hooks/useResource'
import { adminUsersApi } from '../services/wardrobe'

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const resource = useResource(['admin-users', page], () => adminUsersApi.list(page))

  async function updateRole(id: number, role: 'user' | 'admin') {
    setMessage('')
    try {
      await adminUsersApi.changeRole(id, role)
      setMessage('User role updated.')
      resource.retry()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Could not update the role.')
    }
  }

  async function removeUser(id: number, name: string) {
    if (!window.confirm(`Permanently delete ${name} and all data in that account?`)) return
    setMessage('')
    try {
      await adminUsersApi.remove(id)
      setMessage('User and associated data deleted.')
      if (resource.data?.items.length === 1 && page > 1) setPage(page - 1)
      else resource.retry()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Could not delete the user.')
    }
  }

  if (user?.role !== 'admin') {
    return <ErrorState message="Administrator access is required." onRetry={() => window.location.assign('/app/dashboard')} />
  }

  return <>
    <PageHeading eyebrow="Administration" title="Manage users" description="Review accounts, assign roles, and remove accounts with their associated wardrobe data." />
    {message && <p className="feedback" role="status">{message}</p>}
    {resource.loading
      ? <LoadingState label="Loading accounts" />
      : resource.error
        ? <ErrorState message={resource.error.message} onRetry={resource.retry} />
        : <>
          <div className="admin-user-list">
            {(resource.data?.items ?? []).map((account) => <article className="admin-user-row" key={account.user_id}>
              <div><strong>{account.name}</strong><span>{account.email}</span><small>Account #{account.user_id}</small></div>
              <label className="filter-control"><span className="sr-only">Role for {account.name}</span><select value={account.role} disabled={account.user_id === user.user_id} onChange={(event) => void updateRole(account.user_id, event.target.value === 'admin' ? 'admin' : 'user')}><option value="user">User</option><option value="admin">Admin</option></select></label>
              <button className="icon-button button-danger" type="button" aria-label={`Delete ${account.name}`} disabled={account.user_id === user.user_id} onClick={() => void removeUser(account.user_id, account.name)}><Trash2 size={16} /></button>
            </article>)}
          </div>
          {resource.data && resource.data.total_pages > 1 && <nav className="pagination-controls" aria-label="User pages">
            <button className="button-secondary button-small" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {resource.data.page} of {resource.data.total_pages} · {resource.data.total} accounts</span>
            <button className="button-secondary button-small" type="button" disabled={page >= resource.data.total_pages} onClick={() => setPage(page + 1)}>Next</button>
          </nav>}
        </>}
  </>
}
