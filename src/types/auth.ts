export type UserRole = 'super_admin' | 'admin' | 'member' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ClientMember {
  id: string
  user_id: string
  cliente_id: string
  role: UserRole
  created_at: string
  updated_at: string
  profile?: Profile
  clientes?: any
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
  clients: ClientMember[]
}
