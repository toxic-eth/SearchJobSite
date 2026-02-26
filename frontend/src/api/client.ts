import type { AuthResponse, MeResponse, UserRole } from './types'

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
}
