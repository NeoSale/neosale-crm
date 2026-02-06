export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'salesperson'
  | 'member'
  | 'viewer'

export type Permission =
  | 'leads:view_all'
  | 'leads:view_assigned'
  | 'leads:create'
  | 'leads:edit'
  | 'leads:delete'
  | 'leads:assign'
  | 'leads:transfer'
  | 'reports:view'
  | 'reports:export'
  | 'settings:view'
  | 'settings:manage'
  | 'users:view'
  | 'users:manage'

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
