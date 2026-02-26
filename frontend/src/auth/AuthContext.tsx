import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, apiClient } from '../api/client'
import type { AuthUser, UserRole } from '../api/types'

const TOKEN_KEY = 'quickgig.web.token.v1'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (phone: string, password: string, expectedRole?: UserRole) => Promise<boolean>
  register: (name: string, phone: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    setToken(savedToken)
    apiClient
      .me(savedToken)
      .then((response) => {
        setUser(response.user)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(async (phone: string, password: string, expectedRole?: UserRole) => {
    setError(null)
    try {
      const response = await apiClient.login({ phone, password })
      if (expectedRole && response.user.role !== expectedRole) {
        setError(expectedRole === 'worker' ? 'Цей акаунт зареєстровано як роботодавець' : 'Цей акаунт зареєстровано як працівник')
        return false
      }

      setUser(response.user)
      setToken(response.token)
      localStorage.setItem(TOKEN_KEY, response.token)
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка входу')
      return false
    }
  }, [])

  const register = useCallback(async (name: string, phone: string, password: string, role: UserRole) => {
    setError(null)
    try {
      const response = await apiClient.register({ name, phone, password, role })
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem(TOKEN_KEY, response.token)
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка реєстрації')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    const activeToken = token
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    setError(null)

    if (!activeToken) return
    try {
      await apiClient.logout(activeToken)
    } catch {
      // local logout already completed
    }
  }, [token])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, error, login, register, logout, clearError }),
    [user, token, isLoading, error, login, register, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
