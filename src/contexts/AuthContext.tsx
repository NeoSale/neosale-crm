'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient, getSupabaseConfig } from '@/lib/supabase/client'
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

// Função auxiliar para criar perfil a partir do user do Supabase Auth
function createProfileFromUser(user: User): Profile {
  return {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'Usuário',
    avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
    role: user.user_metadata.role as any,
    cliente_id: user.user_metadata.cliente_id || null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingProfileRef = useRef<string | null>(null)
  
  const supabase = createClient()

  const fetchProfile = useCallback(async (currentUser: User) => {
    // Evitar chamadas duplicadas para o mesmo usuário
    if (fetchingProfileRef.current === currentUser.id) {
      console.log('⏭️ fetchProfile já em andamento para:', currentUser.email)
      return
    }
    fetchingProfileRef.current = currentUser.id
    
    try {    
      console.log('🔍 Buscando perfil para:', currentUser.id, currentUser.email)
      
      const { data: dbProfile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      
      console.log('📦 Resultado da query profiles:', { dbProfile, dbError })
      
      let userProfile: Profile
      
      if (dbError || !dbProfile) {
        console.error('❌ Erro ao buscar perfil da tabela profiles:', dbError)
        userProfile = createProfileFromUser(currentUser)
      } else {
        // Usar dados da tabela profiles (fonte confiável do role e cliente_id)
        userProfile = {
          id: dbProfile.id,
          email: dbProfile.email,
          full_name: dbProfile.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          avatar_url: dbProfile.avatar_url || currentUser.user_metadata?.avatar_url || null,
          role: dbProfile.role,
          cliente_id: dbProfile.cliente_id,
          created_at: dbProfile.created_at,
          updated_at: dbProfile.updated_at
        }
        console.log('✅ Perfil carregado do banco:', userProfile)
      }
      
      setProfile(userProfile)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile', JSON.stringify(userProfile))
      }

      // Buscar dados do cliente se houver cliente_id
      if (userProfile.cliente_id) {
        try {
          const { data: clienteData, error: clienteError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', userProfile.cliente_id)
            .single()

          if (!clienteError && clienteData) {
            setCliente(clienteData)
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('selected_cliente_id', clienteData.id)
            }
          } else {
            setCliente(null)
          }
        } catch (err) {
          console.log('⚠️ Erro ao carregar cliente:', err)
          setCliente(null)
        }
      } else {
        setCliente(null)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error)
      // Mesmo com erro, criar perfil básico para não bloquear o usuário
      const basicProfile = createProfileFromUser(currentUser)
      setProfile(basicProfile)
      setCliente(null)
    } finally {
      // Limpar ref após completar (com delay para evitar chamadas imediatas)
      setTimeout(() => {
        fetchingProfileRef.current = null
      }, 1000)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      // Limpar ref para forçar refresh
      fetchingProfileRef.current = null
      await fetchProfile(user)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Carregar perfil e user temporário do localStorage primeiro
    // Isso evita redirecionamento prematuro para /login enquanto a sessão é verificada
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('user_profile')
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile)
          setProfile(parsedProfile)
          // Criar user temporário para evitar redirecionamento
          if (parsedProfile.id && parsedProfile.email) {
            console.log('📦 Carregando user temporário do localStorage:', parsedProfile.email)
            setUser({ id: parsedProfile.id, email: parsedProfile.email } as User)
          }
        } catch (error) {
          console.error('❌ Erro ao carregar perfil do localStorage:', error)
        }
      }
    }

    // Timeout de segurança: força loading = false após 3 segundos
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Safety timeout - forçando loading = false')
      setLoading(false)
    }, 3000)

    // Get initial session
    console.log('🔄 AuthContext - buscando sessão...')
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        clearTimeout(safetyTimeout)
        console.log('📦 AuthContext - getSession resultado:', session?.user?.email || 'sem sessão')
        
        if (session?.user) {
          console.log('✅ AuthContext - sessão encontrada, setando user')
          setUser(session.user)
          fetchProfile(session.user)
          setLoading(false)
        } else {
          // Fallback: verificar se há sessão salva manualmente no localStorage
          if (typeof window !== 'undefined') {
            const { url: supabaseUrl } = getSupabaseConfig()
            if (supabaseUrl) {
              const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
              const storageKey = `sb-${projectRef}-auth-token`
              const savedSession = localStorage.getItem(storageKey)
              
              if (savedSession) {
                try {
                  const parsed = JSON.parse(savedSession)
                  console.log('AuthContext - sessão encontrada no localStorage:', parsed.user?.email)
                  
                  if (parsed.access_token && parsed.user) {
                    // Tentar restaurar a sessão no cliente Supabase
                    supabase.auth.setSession({
                      access_token: parsed.access_token,
                      refresh_token: parsed.refresh_token,
                    }).then((result: { data: { user: User | null; session: Session | null }; error: Error | null }) => {
                      if (result.error) {
                        console.error('Erro ao restaurar sessão:', result.error)
                        localStorage.removeItem(storageKey)
                        localStorage.removeItem('user_profile')
                        setLoading(false)
                      } else if (result.data.user) {
                        console.log('Sessão restaurada com sucesso:', result.data.user.email)
                        setUser(result.data.user)
                        fetchProfile(result.data.user)
                        setLoading(false)
                      }
                    })
                    return // Aguardar o setSession
                  }
                } catch (e) {
                  console.error('Erro ao parsear sessão do localStorage:', e)
                }
              }
            }
            localStorage.removeItem('user_profile')
          }
          setUser(null)
          setLoading(false)
        }
      })
      .catch(() => {
        clearTimeout(safetyTimeout)
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
          setCliente(null)
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
