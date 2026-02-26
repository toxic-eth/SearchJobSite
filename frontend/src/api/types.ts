export type UserRole = 'worker' | 'employer'

export interface AuthUser {
  id: number
  name: string
  phone: string
  email?: string | null
  role: UserRole
  rating?: number
  reviews_count?: number
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface Shift {
  id: number
  employer_id: number
  title: string
  details?: string | null
  pay_per_hour: number
  start_at: string
  end_at: string
  latitude: number
  longitude: number
  address: string
  work_format: 'online' | 'offline'
  required_workers: number
  status?: 'open' | 'closed'
  applications_count?: number
  employer?: {
    id: number
    name: string
    rating?: number
    reviews_count?: number
  }
}

export interface ShiftListResponse {
  data: Shift[]
}

export interface ShiftApplication {
  id: number
  shift_id: number
  worker_id: number
  status: 'pending' | 'accepted' | 'rejected'
  message?: string | null
}

export interface ApplicationsResponse {
  data: ShiftApplication[]
}

export interface ApplicationCreateResponse {
  data: ShiftApplication
}
