import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/States'
import { useAuth } from './useAuth'

export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingState label="Checking your session" />
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
