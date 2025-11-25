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
      console.log('🔍 Carregando perfil do usuário:', currentUser.email)
      console.log('🔍 User:', currentUser)
      
      // IMPORTANTE: O role real está na tabela profiles, não no auth.users
      // O session.user.role retorna apenas "authenticated" (role do Supabase Auth)
      
      console.log('📊 Buscando perfil na tabela profiles para user_id:', currentUser.id)
      
      // Buscar perfil completo da tabela profiles
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      console.log('📊 Resultado da consulta profiles:')
      console.log('  - dbProfile:', dbProfile)
      console.log('  - dbError:', dbError)
      
      let userProfile: Profile
      
      if (dbError || !dbProfile) {
        console.error('❌ Erro ao buscar perfil da tabela profiles:', dbError)
        // Criar perfil básico como fallback
        userProfile = createProfileFromUser(currentUser)
        console.log('⚠️ Usando perfil básico (fallback):', userProfile)
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
        
        console.log('✅ Perfil carregado da tabela profiles:', userProfile)
        console.log('🔑 Role do usuário:', userProfile.role)
      }
      
      // Atualizar estado do perfil
      setProfile(userProfile)

      // Buscar associações de clientes
      try {
        if (userProfile.role !== 'super_admin') {
          const { data: clientsData, error: clientsError } = await supabase
            .from('cliente_members')
            .select('*, clientes(*)')
            .eq('user_id', currentUser.id)

          if (!clientsError && clientsData) {
            setClients(clientsData)
            console.log('✅ Clientes carregados:', clientsData.length)
            
            // Definir automaticamente o primeiro cliente no localStorage se não houver nenhum selecionado
            if (typeof window !== 'undefined' && clientsData.length > 0) {
              const savedClienteId = localStorage.getItem('selected_cliente_id')
              if (!savedClienteId) {
                const firstClienteId = clientsData[0].cliente_id
                localStorage.setItem('selected_cliente_id', firstClienteId)
                console.log('✅ Cliente padrão definido:', firstClienteId)
              }
            }
          } else {
            console.log('⚠️ Não foi possível carregar clientes:', clientsError?.message)
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
            console.log('✅ Todos os clientes carregados (super admin):', virtualMemberships.length)
            
            // Definir automaticamente o primeiro cliente no localStorage se não houver nenhum selecionado
            if (typeof window !== 'undefined' && virtualMemberships.length > 0) {
              const savedClienteId = localStorage.getItem('selected_cliente_id')
              if (!savedClienteId) {
                const firstClienteId = virtualMemberships[0].cliente_id
                localStorage.setItem('selected_cliente_id', firstClienteId)
                console.log('✅ Cliente padrão definido (super admin):', firstClienteId)
              }
            }
          } else {
            console.log('⚠️ Não foi possível carregar todos os clientes:', allClientesError?.message)
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
    // Get initial session
    console.log('🚀 AuthContext: Inicializando...')
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('📝 Sessão obtida:', session?.user ? 'Usuário logado' : 'Sem usuário')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔄 Auth state changed:', event)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setProfile(null)
          setClients([])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      
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
      
      console.log('✅ Limpando estado local...')
      setUser(null)
      setProfile(null)
      setClients([])
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_cliente_id')
        localStorage.removeItem('cliente_id')
      }
      
      console.log('✅ Logout concluído')
    } catch (error) {
      console.error('❌ Erro fatal ao fazer logout:', error)
      // Mesmo com erro, limpar o estado local
      setUser(null)
      setProfile(null)
      setClients([])
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
