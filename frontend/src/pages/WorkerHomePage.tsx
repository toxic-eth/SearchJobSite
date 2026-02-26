import { useAuth } from '../auth/AuthContext'

export function WorkerHomePage() {
  const { user, logout } = useAuth()

  return (
    <main className="dashboard">
      <header>
        <h1>Worker Dashboard</h1>
        <button onClick={() => logout()} type="button">
          Вийти
        </button>
      </header>

      <section className="panel">
        <h2>Вітаємо, {user?.name}</h2>
        <p>Роль: Працівник</p>
        <p>Наступний крок Phase 2: карта + список + фільтри + apply flow.</p>
      </section>
    </main>
  )
}
