export type UserRole = 'super_admin' | 'admin' | 'member' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  cliente_id: string | null
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nome: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
}
