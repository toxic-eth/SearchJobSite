import { useEffect, useMemo, useState } from 'react'
import { ApiError, apiClient } from '../api/client'
import type { Shift, ShiftApplication } from '../api/types'
import { useAuth } from '../auth/AuthContext'

interface ShiftDraft {
  title: string
  details: string
  address: string
  payPerHour: string
  startAt: string
  endAt: string
  latitude: string
  longitude: string
  workFormat: 'online' | 'offline'
  requiredWorkers: string
}

const initialShiftDraft: ShiftDraft = {
  title: '',
  details: '',
  address: '',
  payPerHour: '180',
  startAt: '',
  endAt: '',
  latitude: '50.4501',
  longitude: '30.5234',
  workFormat: 'offline',
  requiredWorkers: '1',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function EmployerHomePage() {
  const { user, token, logout } = useAuth()

  const [draft, setDraft] = useState<ShiftDraft>(initialShiftDraft)
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<ShiftApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    void loadMyShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function loadMyShifts() {
    if (!token) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.myShifts(token)
      setMyShifts(response.data)

      const first = response.data[0] ?? null
      setSelectedShift(first)
      if (first) {
        await loadShiftApplications(first.id)
      } else {
        setSelectedApplications([])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження змін')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadShiftApplications(shiftId: number) {
    if (!token) return

    try {
      const response = await apiClient.shiftById(shiftId, token)
      setSelectedApplications(response.data.applications ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка завантаження відгуків')
    }
  }

  async function handleCreateShift(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setError(null)
    setSuccess(null)

    const payPerHour = Number(draft.payPerHour)
    const latitude = Number(draft.latitude)
    const longitude = Number(draft.longitude)
    const requiredWorkers = Number(draft.requiredWorkers)

    if (!draft.title.trim()) {
      setError('Вкажіть назву зміни')
      return
    }

    if (!draft.startAt || !draft.endAt) {
      setError('Вкажіть дату і час початку/завершення')
      return
    }

    if (Number.isNaN(payPerHour) || payPerHour <= 0) {
      setError('Некоректна оплата за годину')
      return
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError('Некоректні координати')
      return
    }

    if (Number.isNaN(requiredWorkers) || requiredWorkers <= 0) {
      setError('Некоректна кількість місць')
      return
    }

    setIsCreating(true)

    try {
      await apiClient.createShift(token, {
        title: draft.title.trim(),
        details: draft.details.trim(),
        address: draft.address.trim(),
        pay_per_hour: payPerHour,
        start_at: new Date(draft.startAt).toISOString(),
        end_at: new Date(draft.endAt).toISOString(),
        latitude,
        longitude,
        work_format: draft.workFormat,
        required_workers: requiredWorkers,
      })

      setSuccess('Зміну створено')
      setDraft({
        ...initialShiftDraft,
        latitude: draft.latitude,
        longitude: draft.longitude,
      })
      await loadMyShifts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося створити зміну')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSelectShift(shift: Shift) {
    setSelectedShift(shift)
    await loadShiftApplications(shift.id)
  }

  async function updateApplicationStatus(applicationId: number, status: 'accepted' | 'rejected') {
    if (!token) return

    setIsUpdatingStatus(applicationId)
    setError(null)

    try {
      const response = await apiClient.updateApplicationStatus(token, applicationId, status)
      setSelectedApplications((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: response.data.status } : item)))
      setSuccess(status === 'accepted' ? 'Кандидата прийнято' : 'Кандидата відхилено')
      await loadMyShifts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося оновити статус')
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const groupedApplications = useMemo(() => {
    return {
      pending: selectedApplications.filter((item) => item.status === 'pending'),
      accepted: selectedApplications.filter((item) => item.status === 'accepted'),
      rejected: selectedApplications.filter((item) => item.status === 'rejected'),
    }
  }, [selectedApplications])

  return (
    <main className="dashboard">
      <header>
        <h1>Кабінет роботодавця</h1>
        <button onClick={() => logout()} type="button">
          Вийти
        </button>
      </header>

      <section className="panel">
        <h2>Вітаємо, {user?.name}</h2>
        <p className="muted">Створюйте зміни, переглядайте відгуки та керуйте воронкою кандидатів.</p>
      </section>

      <section className="panel">
        <h2>Створити зміну</h2>
        <form className="employer-form" onSubmit={handleCreateShift}>
          <label>
            Назва
            <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Наприклад: Касир на вечір" />
          </label>

          <label>
            Опис
            <textarea
              value={draft.details}
              onChange={(e) => setDraft((prev) => ({ ...prev, details: e.target.value }))}
              placeholder="Коротко опишіть задачу"
              rows={3}
            />
          </label>

          <label>
            Адреса
            <input
              value={draft.address}
              onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
              placeholder={draft.workFormat === 'online' ? 'Онлайн' : 'м. Київ, вул. ...'}
            />
          </label>

          <label>
            Формат
            <select
              value={draft.workFormat}
              onChange={(e) => setDraft((prev) => ({ ...prev, workFormat: e.target.value as 'online' | 'offline' }))}
            >
              <option value="offline">Офлайн</option>
              <option value="online">Онлайн</option>
            </select>
          </label>

          <label>
            Оплата (грн/год)
            <input value={draft.payPerHour} onChange={(e) => setDraft((prev) => ({ ...prev, payPerHour: e.target.value.replace(/\D/g, '') }))} />
          </label>

          <label>
            Кількість місць
            <input
              value={draft.requiredWorkers}
              onChange={(e) => setDraft((prev) => ({ ...prev, requiredWorkers: e.target.value.replace(/\D/g, '') }))}
            />
          </label>

          <label>
            Початок
            <input type="datetime-local" value={draft.startAt} onChange={(e) => setDraft((prev) => ({ ...prev, startAt: e.target.value }))} />
          </label>

          <label>
            Завершення
            <input type="datetime-local" value={draft.endAt} onChange={(e) => setDraft((prev) => ({ ...prev, endAt: e.target.value }))} />
          </label>

          <label>
            Latitude
            <input value={draft.latitude} onChange={(e) => setDraft((prev) => ({ ...prev, latitude: e.target.value }))} />
          </label>

          <label>
            Longitude
            <input value={draft.longitude} onChange={(e) => setDraft((prev) => ({ ...prev, longitude: e.target.value }))} />
          </label>

          <button className="submit" disabled={isCreating} type="submit">
            {isCreating ? 'Створення...' : 'Створити зміну'}
          </button>
        </form>
      </section>

      {(error || success) && (
        <section className="panel">
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </section>
      )}

      <section className="panel">
        <h2>Мої зміни</h2>
        {isLoading ? (
          <p>Завантаження...</p>
        ) : myShifts.length === 0 ? (
          <p>Поки немає створених змін.</p>
        ) : (
          <div className="shift-list">
            {myShifts.map((shift) => (
              <article key={shift.id} className={`panel shift-card ${selectedShift?.id === shift.id ? 'selected' : ''}`}>
                <div className="shift-head">
                  <h3>{shift.title}</h3>
                  <span className="price">{shift.pay_per_hour} грн/год</span>
                </div>
                <p className="muted">{shift.address || 'Адреса не вказана'} • {shift.work_format === 'online' ? 'Онлайн' : 'Офлайн'}</p>
                <p className="muted">{formatDate(shift.start_at)} — {formatDate(shift.end_at)}</p>
                <p className="muted">Кандидатів: {shift.applications_count ?? 0} / місць: {shift.required_workers}</p>
                <button className="submit" type="button" onClick={() => void handleSelectShift(shift)}>
                  Відкрити воронку
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedShift && (
        <section className="panel">
          <h2>Воронка відгуків: {selectedShift.title}</h2>
          <div className="funnel-grid">
            <div className="funnel-col">
              <h3>Очікують ({groupedApplications.pending.length})</h3>
              {groupedApplications.pending.map((application) => (
                <article key={application.id} className="panel mini-card">
                  <p><b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b></p>
                  <p className="muted">Статус: {application.status}</p>
                  <div className="actions-row">
                    <button
                      type="button"
                      className="accept-btn"
                      disabled={isUpdatingStatus === application.id}
                      onClick={() => void updateApplicationStatus(application.id, 'accepted')}
                    >
                      Прийняти
                    </button>
                    <button
                      type="button"
                      className="reject-btn"
                      disabled={isUpdatingStatus === application.id}
                      onClick={() => void updateApplicationStatus(application.id, 'rejected')}
                    >
                      Відхилити
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="funnel-col">
              <h3>Прийняті ({groupedApplications.accepted.length})</h3>
              {groupedApplications.accepted.map((application) => (
                <article key={application.id} className="panel mini-card">
                  <p><b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b></p>
                  <p className="muted">Статус: {application.status}</p>
                </article>
              ))}
            </div>

            <div className="funnel-col">
              <h3>Відхилені ({groupedApplications.rejected.length})</h3>
              {groupedApplications.rejected.map((application) => (
                <article key={application.id} className="panel mini-card">
                  <p><b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b></p>
                  <p className="muted">Статус: {application.status}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
