'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile, Cliente } from '@/types/auth'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  cliente: Cliente | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Função para buscar perfil do banco - chamada APENAS no login ou refreshProfile
  const fetchProfileFromDB = useCallback(async (currentUser: User): Promise<Profile | null> => {
    try {    
      console.log('🔍 Buscando perfil do banco para:', currentUser.email)
      
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      if (dbError || !dbProfile) {
        console.error('❌ Erro ao buscar perfil:', dbError)
        return null
      }
      
      const userProfile: Profile = {
        id: dbProfile.id,
        email: dbProfile.email,
        full_name: dbProfile.full_name || currentUser.email?.split('@')[0] || 'Usuário',
        avatar_url: dbProfile.avatar_url || null,
        role: dbProfile.role,
        cliente_id: dbProfile.cliente_id,
        created_at: dbProfile.created_at,
        updated_at: dbProfile.updated_at
      }
      
      console.log('✅ Perfil carregado do banco:', userProfile)
      return userProfile
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error)
      return null
    }
  }, [supabase])

  // Função para forçar refresh do perfil (busca do banco)
  const refreshProfile = useCallback(async () => {
    if (user) {
      const dbProfile = await fetchProfileFromDB(user)
      if (dbProfile) {
        setProfile(dbProfile)
        localStorage.setItem('user_profile', JSON.stringify(dbProfile))
      }
    }
  }, [user, fetchProfileFromDB])

  useEffect(() => {
    // 1. Carregar perfil do localStorage PRIMEIRO (evita redirecionamento e busca desnecessária)
    let localProfile: Profile | null = null
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('user_profile')
      if (savedProfile) {
        try {
          localProfile = JSON.parse(savedProfile)
          if (localProfile) {
            console.log('📦 Usando perfil do localStorage:', localProfile.email, 'role:', localProfile.role)
            setProfile(localProfile)
            // Criar user temporário para evitar redirecionamento
            setUser({ id: localProfile.id, email: localProfile.email } as User)
          }
        } catch (error) {
          console.error('❌ Erro ao carregar perfil do localStorage:', error)
        }
      }
    }

    // 2. Verificar sessão do Supabase com timeout
    console.log('🔄 AuthContext - verificando sessão...')
    const sessionTimeout = new Promise<{ data: { session: Session | null } }>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ Timeout ao verificar sessão do Supabase')
        resolve({ data: { session: null } })
      }, 5000)
    })
    
    Promise.race([supabase.auth.getSession(), sessionTimeout])
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        console.log('📦 AuthContext - sessão:', session?.user?.email || 'sem sessão')
        
        if (session?.user) {
          setUser(session.user)
          // Se já tem perfil no localStorage com role, usar ele
          // Não buscar do banco novamente
          if (localProfile?.role) {
            console.log('✅ Usando perfil do localStorage (já tem role)')
          }
          // Se não tem perfil local ou não tem role, buscar do banco
          else if (!localProfile || !localProfile.role) {
            console.log('🔄 Perfil local sem role, buscando do banco...')
            fetchProfileFromDB(session.user).then(dbProfile => {
              if (dbProfile) {
                setProfile(dbProfile)
                localStorage.setItem('user_profile', JSON.stringify(dbProfile))
              }
            })
          }
        } else {
          // Sem sessão - limpar tudo
          if (localProfile) {
            console.log('⚠️ Sem sessão mas tem perfil local - limpando')
            localStorage.removeItem('user_profile')
            localStorage.removeItem('selected_cliente_id')
          }
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      })
      .catch((error: Error) => {
        console.error('❌ Erro ao verificar sessão:', error)
        setLoading(false)
      })

    // 3. Escutar mudanças de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔔 Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          // No login, buscar perfil do banco e salvar no localStorage
          const dbProfile = await fetchProfileFromDB(session.user)
          if (dbProfile) {
            setProfile(dbProfile)
            localStorage.setItem('user_profile', JSON.stringify(dbProfile))
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCliente(null)
          localStorage.removeItem('user_profile')
          localStorage.removeItem('selected_cliente_id')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfileFromDB])

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
      setCliente(null)
      
      // Limpar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_cliente_id')
        localStorage.removeItem('user_profile')
      }
      
    } catch (error) {
      console.error('❌ Erro fatal ao fazer logout:', error)
      // Mesmo com erro, limpar o estado local
      setUser(null)
      setProfile(null)
      setCliente(null)
      
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
        cliente,
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
