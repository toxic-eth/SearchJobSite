import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="centered">Завантаження...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
