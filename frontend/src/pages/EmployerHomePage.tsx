import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { ApiError, apiClient } from '../api/client'
import type { Shift, ShiftApplication } from '../api/types'
import { useAuth } from '../auth/AuthContext'

type FormMode = 'create' | 'edit'

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

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

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

function toDateTimeLocal(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

function inferAddressFallback(lat: number, lng: number): string {
  return `Координати: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const endpoint = new URL('https://nominatim.openstreetmap.org/reverse')
  endpoint.searchParams.set('lat', String(lat))
  endpoint.searchParams.set('lon', String(lng))
  endpoint.searchParams.set('format', 'jsonv2')
  endpoint.searchParams.set('accept-language', 'uk')

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Accept: 'application/json',
      },
    })
    if (!response.ok) return inferAddressFallback(lat, lng)
    const data = (await response.json()) as { display_name?: string }
    return data.display_name ?? inferAddressFallback(lat, lng)
  } catch {
    return inferAddressFallback(lat, lng)
  }
}

function LocationPickerMap({
  lat,
  lng,
  onChange,
}: {
  lat: number
  lng: number
  onChange: (latitude: number, longitude: number) => void
}) {
  useMapEvents({
    click: (event) => {
      onChange(event.latlng.lat, event.latlng.lng)
    },
  })

  return (
    <Marker
      icon={markerIcon}
      position={[lat, lng]}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const target = event.target as L.Marker
          const position = target.getLatLng()
          onChange(position.lat, position.lng)
        },
      }}
    />
  )
}

export function EmployerHomePage() {
  const { user, token, logout } = useAuth()

  const [mode, setMode] = useState<FormMode>('create')
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ShiftDraft>(initialShiftDraft)
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<ShiftApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  function resetCreateMode() {
    setMode('create')
    setEditingShiftId(null)
    setDraft(initialShiftDraft)
  }

  function enterEditMode(shift: Shift) {
    setMode('edit')
    setEditingShiftId(shift.id)
    setDraft({
      title: shift.title,
      details: shift.details ?? '',
      address: shift.address ?? '',
      payPerHour: String(shift.pay_per_hour),
      startAt: toDateTimeLocal(shift.start_at),
      endAt: toDateTimeLocal(shift.end_at),
      latitude: String(shift.latitude),
      longitude: String(shift.longitude),
      workFormat: shift.work_format,
      requiredWorkers: String(shift.required_workers),
    })
  }

  async function saveShift(event: React.FormEvent<HTMLFormElement>) {
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

    setIsSaving(true)

    const payload = {
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
    }

    try {
      if (mode === 'create') {
        const response = await apiClient.createShift(token, payload)
        setSuccess('Зміну створено')
        resetCreateMode()
        setSelectedShift(response.data)
      } else if (editingShiftId) {
        const response = await apiClient.updateShift(token, editingShiftId, payload)
        setSuccess('Зміну оновлено')
        setSelectedShift(response.data)
      }

      await loadMyShifts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Помилка збереження зміни')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleShiftStatus(shift: Shift) {
    if (!token) return
    const nextStatus = shift.status === 'closed' ? 'open' : 'closed'

    try {
      await apiClient.updateShift(token, shift.id, { status: nextStatus })
      setSuccess(nextStatus === 'closed' ? 'Зміну закрито' : 'Зміну перевідкрито')
      await loadMyShifts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося оновити статус зміни')
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

  const analytics = useMemo(() => {
    const totalShifts = myShifts.length
    const totalApplies = myShifts.reduce((sum, shift) => sum + (shift.applications_count ?? 0), 0)
    const totalAccepted = myShifts.reduce((sum, shift) => sum + (shift.accepted_applications_count ?? 0), 0)
    const acceptedRate = totalApplies > 0 ? Math.round((totalAccepted / totalApplies) * 100) : 0

    return { totalShifts, totalApplies, totalAccepted, acceptedRate }
  }, [myShifts])

  async function updateDraftLocation(latitude: number, longitude: number) {
    setDraft((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }))

    if (draft.workFormat === 'online') return
    const address = await reverseGeocode(latitude, longitude)
    setDraft((prev) => ({ ...prev, address }))
  }

  const draftLat = Number(draft.latitude)
  const draftLng = Number(draft.longitude)
  const canRenderMap = !Number.isNaN(draftLat) && !Number.isNaN(draftLng)

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
        <p className="muted">Створюйте зміни, редагуйте їх та керуйте воронкою кандидатів.</p>
      </section>

      <section className="panel analytics-grid">
        <article>
          <h3>Змін</h3>
          <p>{analytics.totalShifts}</p>
        </article>
        <article>
          <h3>Відгуків</h3>
          <p>{analytics.totalApplies}</p>
        </article>
        <article>
          <h3>Прийнято</h3>
          <p>{analytics.totalAccepted}</p>
        </article>
        <article>
          <h3>Conversion</h3>
          <p>{analytics.acceptedRate}%</p>
        </article>
      </section>

      <section className="panel">
        <div className="form-mode-header">
          <h2>{mode === 'create' ? 'Створити зміну' : 'Редагування зміни'}</h2>
          {mode === 'edit' && (
            <button className="ghost-btn" type="button" onClick={resetCreateMode}>
              Вийти з редагування
            </button>
          )}
        </div>

        <form className="employer-form" onSubmit={saveShift}>
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

          {canRenderMap && draft.workFormat === 'offline' && (
            <div className="map-picker-wrap">
              <MapContainer center={[draftLat, draftLng]} zoom={13} style={{ height: 300, width: '100%', borderRadius: 12 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerMap lat={draftLat} lng={draftLng} onChange={updateDraftLocation} />
              </MapContainer>
              <p className="muted">Клікніть по мапі або перетягніть маркер, щоб обрати адресу.</p>
            </div>
          )}

          <button className="submit" disabled={isSaving} type="submit">
            {isSaving ? 'Збереження...' : mode === 'create' ? 'Створити зміну' : 'Зберегти зміни'}
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
                <p className="muted">
                  {shift.address || 'Адреса не вказана'} • {shift.work_format === 'online' ? 'Онлайн' : 'Офлайн'} •{' '}
                  <b>{shift.status === 'closed' ? 'Закрита' : 'Відкрита'}</b>
                </p>
                <p className="muted">
                  {formatDate(shift.start_at)} — {formatDate(shift.end_at)}
                </p>
                <p className="muted">
                  Pending: {shift.pending_applications_count ?? 0} • Accepted: {shift.accepted_applications_count ?? 0} • Rejected:{' '}
                  {shift.rejected_applications_count ?? 0}
                </p>
                <div className="actions-row">
                  <button className="submit" type="button" onClick={() => void handleSelectShift(shift)}>
                    Відкрити воронку
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => enterEditMode(shift)}>
                    Редагувати
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => void toggleShiftStatus(shift)}>
                    {shift.status === 'closed' ? 'Перевідкрити' : 'Закрити'}
                  </button>
                </div>
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
                  <p>
                    <b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b>
                  </p>
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
                  <p>
                    <b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b>
                  </p>
                  <p className="muted">Статус: {application.status}</p>
                </article>
              ))}
            </div>

            <div className="funnel-col">
              <h3>Відхилені ({groupedApplications.rejected.length})</h3>
              {groupedApplications.rejected.map((application) => (
                <article key={application.id} className="panel mini-card">
                  <p>
                    <b>{application.worker?.name ?? `Worker #${application.worker_id}`}</b>
                  </p>
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
