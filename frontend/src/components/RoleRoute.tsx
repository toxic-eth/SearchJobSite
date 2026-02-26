import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../api/types'

export function RoleRoute({ role }: { role: UserRole }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'worker' ? '/worker' : '/employer'} replace />
  }

  return <Outlet />
}
