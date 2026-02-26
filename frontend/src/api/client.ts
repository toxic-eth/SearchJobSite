import type {
  ApplicationCreateResponse,
  ApplicationsResponse,
  AuthResponse,
  MeResponse,
  ShiftDetailResponse,
  ShiftListResponse,
  UserRole,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  token?: string | null
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const serverMessage = firstErrorFromPayload(payload) ?? payload?.message
    throw new ApiError(serverMessage ?? `HTTP ${response.status}`, response.status)
  }

  return payload as T
}

function firstErrorFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const typed = payload as Record<string, unknown>
  const errors = typed.errors
  if (!errors || typeof errors !== 'object') return undefined

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0]
    }
  }

  return undefined
}

export const apiClient = {
  register(input: { name: string; phone: string; password: string; role: UserRole }) {
    return request<AuthResponse>('/register', {
      method: 'POST',
      body: input,
    })
  },

  login(input: { phone: string; password: string }) {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: input,
    })
  },

  me(token: string) {
    return request<MeResponse>('/me', { token })
  },

  logout(token: string) {
    return request<{ message: string }>('/logout', {
      method: 'POST',
      token,
    })
  },

  shifts() {
    return request<ShiftListResponse>('/shifts')
  },

  shiftById(shiftId: number, token?: string | null) {
    return request<ShiftDetailResponse>(`/shifts/${shiftId}`, { token })
  },

  myShifts(token: string) {
    return request<ShiftListResponse>('/my/shifts', { token })
  },

  createShift(
    token: string,
    input: {
      title: string
      details?: string
      address?: string
      pay_per_hour: number
      start_at: string
      end_at: string
      latitude: number
      longitude: number
      work_format: 'online' | 'offline'
      required_workers: number
    },
  ) {
    return request<ShiftDetailResponse>('/shifts', {
      method: 'POST',
      token,
      body: input,
    })
  },

  updateShift(
    token: string,
    shiftId: number,
    input: Partial<{
      title: string
      details: string
      address: string
      pay_per_hour: number
      start_at: string
      end_at: string
      latitude: number
      longitude: number
      work_format: 'online' | 'offline'
      required_workers: number
      status: 'open' | 'closed'
    }>,
  ) {
    return request<ShiftDetailResponse>(`/shifts/${shiftId}`, {
      method: 'PATCH',
      token,
      body: input,
    })
  },

  myApplications(token: string) {
    return request<ApplicationsResponse>('/my/applications', { token })
  },

  applyToShift(token: string, shiftId: number, message?: string) {
    return request<ApplicationCreateResponse>(`/shifts/${shiftId}/apply`, {
      method: 'POST',
      token,
      body: message ? { message } : {},
    })
  },

  updateApplicationStatus(
    token: string,
    applicationId: number,
    status: 'pending' | 'accepted' | 'rejected',
  ) {
    return request<ApplicationCreateResponse>(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      token,
      body: { status },
    })
  },
}
