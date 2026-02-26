import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { UserRole } from '../api/types'

type AuthMode = 'login' | 'register'

function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

function isValidPhone(phone: string): boolean {
  return /^380\d{9}$/.test(phone)
}

export function AuthPage() {
  const navigate = useNavigate()
  const { login, register, error, clearError } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('worker')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(() => {
    if (mode === 'login') {
      return role === 'worker' ? 'Вхід для працівника' : 'Вхід для роботодавця'
    }
    return role === 'worker' ? 'Реєстрація працівника' : 'Реєстрація роботодавця'
  }, [mode, role])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setLocalError(null)

    const normalizedPhone = normalizePhone(phone)
    if (!isValidPhone(normalizedPhone)) {
      setLocalError('Номер має починатися з 380 і містити 12 цифр')
      return
    }

    if (password.length < 6) {
      setLocalError('Пароль має містити щонайменше 6 символів')
      return
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalError(role === 'worker' ? "Введіть ім'я" : 'Введіть назву компанії')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Паролі не збігаються')
        return
      }
    }

    setIsSubmitting(true)
    let ok = false
    if (mode === 'login') {
      ok = await login(normalizedPhone, password, role)
    } else {
      ok = await register(name.trim(), normalizedPhone, password, role)
    }
    setIsSubmitting(false)

    if (ok) {
      navigate(role === 'worker' ? '/worker' : '/employer', { replace: true })
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>{title}</h1>
        <p className="muted">QuickGig Web • Phase 1</p>

        <div className="switch-row">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Вхід
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Реєстрація
          </button>
        </div>

        <div className="switch-row role-row">
          <button className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')} type="button">
            Працівник
          </button>
          <button className={role === 'employer' ? 'active' : ''} onClick={() => setRole('employer')} type="button">
            Роботодавець
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <label>
              {role === 'worker' ? "Ім'я" : 'Назва компанії'}
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'worker' ? "Ім'я та прізвище" : 'Компанія'} />
            </label>
          )}

          <label>
            Телефон
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="380XXXXXXXXX" />
          </label>

          <label>
            Пароль
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Не менше 6 символів" />
          </label>

          {mode === 'register' && (
            <label>
              Повторіть пароль
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторіть пароль"
              />
            </label>
          )}

          {(localError || error) && <p className="error">{localError ?? error}</p>}

          <button className="submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Зачекайте...' : mode === 'login' ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
