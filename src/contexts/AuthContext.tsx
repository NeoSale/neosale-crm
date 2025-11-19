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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [clients, setClients] = useState<ClientMember[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil para userId:', userId)
      
      // Verificar se o cliente Supabase está configurado
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📝 Sessão ativa:', session ? 'Sim' : 'Não')
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        
        // Se o perfil não existe ou há erro de permissão, tentar criar
        if (profileError.code === 'PGRST116' || profileError.code === 'PGRST301' || profileError.message?.includes('permission')) {
          console.log('⚠️ Perfil não encontrado ou sem permissão, tentando criar...')
          
          // Tentar com upsert (funciona mesmo sem política INSERT se tiver UPDATE)
          const { data: upsertProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: session?.user?.email || '',
              full_name: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || '',
              role: 'viewer',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single()
          
          if (upsertError) {
            console.error('❌ Erro ao fazer upsert do perfil:', upsertError)
            
            // Última tentativa: criar perfil temporário no estado local
            console.log('⚠️ Criando perfil temporário no estado local...')
            const tempProfile: Profile = {
              id: userId,
              email: session?.user?.email || '',
              full_name: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Usuário',
              avatar_url: null,
              role: 'viewer',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setProfile(tempProfile)
            console.log('⚠️ Usando perfil temporário. IMPORTANTE: Aplique a migration 004_fix_profiles_insert_policy.sql')
            return
          }
          
          console.log('✅ Perfil criado via upsert:', upsertProfile)
          setProfile(upsertProfile)
          return
        }
        
        throw profileError
      }

      console.log('✅ Perfil encontrado:', profileData)
      setProfile(profileData)

      // Fetch client memberships
      if (profileData.role !== 'super_admin') {
        const { data: clientsData, error: clientsError } = await supabase
          .from('cliente_members')
          .select('*, clientes(*)')
          .eq('user_id', userId)

        if (clientsError) throw clientsError
        setClients(clientsData || [])
      } else {
        // Super admin has access to all clients
        const { data: allClientes, error: allClientesError } = await supabase
          .from('clientes')
          .select('*')

        if (allClientesError) throw allClientesError
        
        // Create virtual client memberships for super admin
        const virtualMemberships = (allClientes || []).map((cliente: any) => ({
          id: `virtual-${cliente.id}`,
          user_id: userId,
          cliente_id: cliente.id,
          role: 'super_admin' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          clientes: cliente
        }))
        
        setClients(virtualMemberships)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Get initial session
    console.log('🚀 AuthContext: Inicializando...')
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('📝 Sessão obtida:', session?.user ? 'Usuário logado' : 'Sem usuário')
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('👤 User ID:', session.user.id)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setClients([])
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setClients([])
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
