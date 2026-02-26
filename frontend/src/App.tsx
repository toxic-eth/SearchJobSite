import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { AuthPage } from './pages/AuthPage'
import { EmployerHomePage } from './pages/EmployerHomePage'
import { WorkerHomePage } from './pages/WorkerHomePage'
import './App.css'

function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="centered">Завантаження...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Navigate to={user.role === 'worker' ? '/worker' : '/employer'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="worker" />}>
          <Route path="/worker" element={<WorkerHomePage />} />
        </Route>

        <Route element={<RoleRoute role="employer" />}>
          <Route path="/employer" element={<EmployerHomePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
