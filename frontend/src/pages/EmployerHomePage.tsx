import { useAuth } from '../auth/AuthContext'

export function EmployerHomePage() {
  const { user, logout } = useAuth()

  return (
    <main className="dashboard">
      <header>
        <h1>Employer Dashboard</h1>
        <button onClick={() => logout()} type="button">
          Вийти
        </button>
      </header>

      <section className="panel">
        <h2>Вітаємо, {user?.name}</h2>
        <p>Роль: Роботодавець</p>
        <p>Наступний крок Phase 3: wizard створення зміни та воронка відгуків.</p>
      </section>
    </main>
  )
}
