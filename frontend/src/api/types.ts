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
