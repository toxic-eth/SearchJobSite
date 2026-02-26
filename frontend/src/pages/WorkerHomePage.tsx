import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ApiError, apiClient } from '../api/client'
import type { Shift, ShiftApplication } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import 'leaflet/dist/leaflet.css'

type ViewMode = 'list' | 'map'
type WorkFormatFilter = 'all' | 'online' | 'offline'

const defaultCenter: [number, number] = [50.4501, 30.5234] // Kyiv

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function FitToShift({ shift }: { shift: Shift | null }) {
  const map = useMap()

  useEffect(() => {
    if (!shift) return
    map.flyTo([shift.latitude, shift.longitude], Math.max(map.getZoom(), 13), {
      duration: 0.35,
    })
  }, [map, shift])

  return null
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const R = 6371
  const dLat = ((toLat - fromLat) * Math.PI) / 180
  const dLng = ((toLng - fromLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) * Math.cos((toLat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function WorkerHomePage() {
  const { user, token, logout } = useAuth()

  const [mode, setMode] = useState<ViewMode>('list')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [applicationsByShiftId, setApplicationsByShiftId] = useState<Record<number, ShiftApplication>>({})
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)

  const [search, setSearch] = useState('')
  const [minPay, setMinPay] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [maxDistanceKm, setMaxDistanceKm] = useState('')
  const [formatFilter, setFormatFilter] = useState<WorkFormatFilter>('all')

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingShiftId, setApplyingShiftId] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // Optional location; ignore denial
      },
      { enableHighAccuracy: true, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const [shiftsResponse, applicationsResponse] = await Promise.all([
          apiClient.shifts(),
          token ? apiClient.myApplications(token) : Promise.resolve({ data: [] }),
        ])

        setShifts(shiftsResponse.data)
        const map: Record<number, ShiftApplication> = {}
        for (const application of applicationsResponse.data) {
          map[application.shift_id] = application
        }
        setApplicationsByShiftId(map)

        if (shiftsResponse.data.length > 0) {
          setSelectedShift(shiftsResponse.data[0])
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Помилка завантаження змін')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [token])

  const filteredShifts = useMemo(() => {
    const minPayValue = minPay ? Number(minPay) : null
    const maxDistanceValue = maxDistanceKm ? Number(maxDistanceKm) : null
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null
    const searchLower = search.trim().toLowerCase()

    return shifts.filter((shift) => {
      const inferredFormat: WorkFormatFilter = /\\b(online|remote|онлайн)\\b/i.test(`${shift.title} ${shift.details ?? ''}`)
        ? 'online'
        : 'offline'
      if (formatFilter !== 'all' && inferredFormat !== formatFilter) return false

      if (searchLower) {
        const haystack = `${shift.title} ${shift.details ?? ''} ${shift.employer?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(searchLower)) return false
      }

      if (minPayValue !== null && shift.pay_per_hour < minPayValue) return false

      const start = new Date(shift.start_at)
      if (fromDate && start < fromDate) return false
      if (toDate && start > toDate) return false

      if (maxDistanceValue !== null && location) {
        const km = distanceKm(location.lat, location.lng, shift.latitude, shift.longitude)
        if (km > maxDistanceValue) return false
      }

      return true
    })
  }, [dateFrom, dateTo, formatFilter, location, maxDistanceKm, minPay, search, shifts])

  async function applyToShift(shift: Shift) {
    if (!token) return
    setApplyingShiftId(shift.id)
    setError(null)

    try {
      const response = await apiClient.applyToShift(token, shift.id)
      setApplicationsByShiftId((prev) => ({
        ...prev,
        [shift.id]: response.data,
      }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не вдалося відгукнутися')
    } finally {
      setApplyingShiftId(null)
    }
  }

  return (
    <main className="dashboard">
      <header>
        <h1>Зміни для працівника</h1>
        <button onClick={() => logout()} type="button">
          Вийти
        </button>
      </header>

      <section className="panel filters-grid">
        <div className="switch-row view-mode-row">
          <button className={mode === 'list' ? 'active' : ''} onClick={() => setMode('list')} type="button">
            Списком
          </button>
          <button className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')} type="button">
            На мапі
          </button>
        </div>

        <label>
          Пошук
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Назва, опис, компанія" />
        </label>

        <label>
          Мін. оплата, грн/год
          <input value={minPay} onChange={(e) => setMinPay(e.target.value.replace(/\D/g, ''))} placeholder="150" />
        </label>

        <label>
          Від дати
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label>
          До дати
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>

        <label>
          Макс. дистанція (км)
          <input
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder={location ? '5' : 'Увімкніть геолокацію'}
          />
        </label>

        <label>
          Формат
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as WorkFormatFilter)}>
            <option value="all">Усі</option>
            <option value="online">Онлайн</option>
            <option value="offline">Офлайн</option>
          </select>
        </label>
      </section>

      {error && (
        <section className="panel">
          <p className="error">{error}</p>
        </section>
      )}

      <section className="panel">
        <p className="muted">
          {user?.name}, знайдено змін: <b>{filteredShifts.length}</b>
        </p>
      </section>

      {isLoading ? (
        <section className="panel">Завантаження змін...</section>
      ) : mode === 'list' ? (
        <section className="shift-list">
          {filteredShifts.map((shift) => {
            const application = applicationsByShiftId[shift.id]
            const distance =
              location !== null
                ? distanceKm(location.lat, location.lng, shift.latitude, shift.longitude).toFixed(1)
                : null

            return (
              <article key={shift.id} className="panel shift-card" onClick={() => setSelectedShift(shift)}>
                <div className="shift-head">
                  <h3>{shift.title}</h3>
                  <span className="price">{shift.pay_per_hour} грн/год</span>
                </div>
                <p>{shift.details}</p>
                <p className="muted">Роботодавець: {shift.employer?.name ?? '—'}</p>
                <p className="muted">Початок: {formatDate(shift.start_at)}</p>
                <p className="muted">Кандидатів: {shift.applications_count ?? 0}</p>
                {distance && <p className="muted">Відстань: {distance} км</p>}

                {application ? (
                  <span className={`status-pill ${application.status}`}>Ваш статус: {application.status}</span>
                ) : (
                  <button
                    className="submit"
                    disabled={applyingShiftId === shift.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      void applyToShift(shift)
                    }}
                    type="button"
                  >
                    {applyingShiftId === shift.id ? 'Відправка...' : 'Відгукнутися'}
                  </button>
                )}
              </article>
            )
          })}

          {filteredShifts.length === 0 && <article className="panel">Нічого не знайдено за поточними фільтрами.</article>}
        </section>
      ) : (
        <section className="panel map-wrap">
          <MapContainer center={defaultCenter} zoom={6} style={{ height: 500, width: '100%', borderRadius: 12 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {location && (
              <CircleMarker center={[location.lat, location.lng]} radius={10} pathOptions={{ color: '#8a30ff', fillColor: '#8a30ff' }}>
                <Popup>Ви тут</Popup>
              </CircleMarker>
            )}

            {filteredShifts.map((shift) => (
              <Marker
                key={shift.id}
                icon={markerIcon}
                position={[shift.latitude, shift.longitude]}
                eventHandlers={{
                  click: () => setSelectedShift(shift),
                }}
              >
                <Popup>
                  <b>{shift.title}</b>
                  <br />
                  {shift.pay_per_hour} грн/год
                </Popup>
              </Marker>
            ))}

            <FitToShift shift={selectedShift} />
          </MapContainer>
        </section>
      )}

      {selectedShift && (
        <section className="panel">
          <h2>Обрана зміна: {selectedShift.title}</h2>
          <p>{selectedShift.details}</p>
          <p className="muted">Компанія: {selectedShift.employer?.name ?? '—'}</p>
          <p className="muted">Оплата: {selectedShift.pay_per_hour} грн/год</p>
          <p className="muted">Період: {formatDate(selectedShift.start_at)} — {formatDate(selectedShift.end_at)}</p>
        </section>
      )}
    </main>
  )
}
