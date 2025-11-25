'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile, ClientMember } from '@/types/auth'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  clients: ClientMember[]
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Função auxiliar para criar perfil a partir do user do Supabase Auth
function createProfileFromUser(user: User): Profile {

  return {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'Usuário',
    avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
    role: user.user_metadata.role as any,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clients, setClients] = useState<ClientMember[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {    
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      let userProfile: Profile
      
      if (dbError || !dbProfile) {
        console.error('❌ Erro ao buscar perfil da tabela profiles:', dbError)
        userProfile = createProfileFromUser(currentUser)
      } else {
        // Usar dados da tabela profiles (fonte confiável do role)
        userProfile = {
          id: dbProfile.id,
          email: dbProfile.email,
          full_name: dbProfile.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          avatar_url: dbProfile.avatar_url || currentUser.user_metadata?.avatar_url || null,
          role: dbProfile.role, // ROLE CORRETO vem da tabela profiles
          created_at: dbProfile.created_at,
          updated_at: dbProfile.updated_at
        }
      }
      
      setProfile(userProfile)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile', JSON.stringify(userProfile))
      }

      // Buscar associações de clientes
      try {
        if (userProfile.role !== 'super_admin') {
          const { data: clientsData, error: clientsError } = await supabase
            .from('cliente_members')
            .select('*, clientes(*)')
            .eq('user_id', currentUser.id)

          if (!clientsError && clientsData) {
            setClients(clientsData)
            
            if (typeof window !== 'undefined' && clientsData.length > 0) {
              const savedClienteId = localStorage.getItem('selected_cliente_id')
              if (!savedClienteId) {
                const firstClienteId = clientsData[0].cliente_id
                localStorage.setItem('selected_cliente_id', firstClienteId)
              }
            }
          } else {
            setClients([])
          }
        } else {
          // Super admin tem acesso a todos os clientes
          const { data: allClientes, error: allClientesError } = await supabase
            .from('clientes')
            .select('*')

          if (!allClientesError && allClientes) {
            // Criar memberships virtuais para super admin
            const virtualMemberships = allClientes.map((cliente: any) => ({
              id: `virtual-${cliente.id}`,
              user_id: currentUser.id,
              cliente_id: cliente.id,
              role: 'super_admin' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              clientes: cliente
            }))
            
            setClients(virtualMemberships)
            
            if (typeof window !== 'undefined' && virtualMemberships.length > 0) {
              const savedClienteId = localStorage.getItem('selected_cliente_id')
              if (!savedClienteId) {
                const firstClienteId = virtualMemberships[0].cliente_id
                localStorage.setItem('selected_cliente_id', firstClienteId)
              }
            }
          } else {
            setClients([])
          }
        }
      } catch (err) {
        console.log('⚠️ Erro ao carregar clientes:', err)
        setClients([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error)
      // Mesmo com erro, criar perfil básico para não bloquear o usuário
      const basicProfile = createProfileFromUser(currentUser)
      setProfile(basicProfile)
      setClients([])
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Carregar perfil do localStorage primeiro (para evitar perder o role)
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('user_profile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setProfile(parsedProfile)
        } catch (error) {
          console.error('❌ Erro ao carregar perfil do localStorage:', error)
        }
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        // Limpar localStorage se não houver sessão
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_profile')
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setProfile(null)
          setClients([])
          // Limpar localStorage quando não houver sessão
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_profile')
            localStorage.removeItem('selected_cliente_id')
          }
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    try {      
      // Criar promise com timeout de 3 segundos
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
      
      try {
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any
        if (error) {
          console.error('❌ Erro ao fazer logout:', error)
        }
      } catch (timeoutError: any) {
        if (timeoutError.message === 'Timeout') {
          console.log('⚠️ Timeout ao fazer logout no Supabase, continuando...')
        } else {
          throw timeoutError
        }
      }
      
      setUser(null)
      setProfile(null)
      setClients([])
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_cliente_id')
        localStorage.removeItem('cliente_id')
      }
      
    } catch (error) {
      console.error('❌ Erro fatal ao fazer logout:', error)
      // Mesmo com erro, limpar o estado local
      setUser(null)
      setProfile(null)
      setClients([])
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_profile')
        localStorage.removeItem('selected_cliente_id')
      }
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        clients,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
