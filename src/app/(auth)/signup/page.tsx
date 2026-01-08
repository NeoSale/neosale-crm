'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, getSupabaseConfig } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Chrome, Apple, Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isInvitedUser, setIsInvitedUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  // Armazenar dados do usuário convidado usando ref (síncrono, não depende de re-render)
  const invitedUserDataRef = useRef<{ userId: string; accessToken: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      })
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  // Verificar se usuário veio de um convite (magic link/invite)
  useEffect(() => {
    const fillUserData = async (user: any) => {
      console.log('fillUserData chamado com:', user?.email, user?.user_metadata)
      
      // IMPORTANTE: Setar isInvitedUser primeiro para garantir UI correta
      setIsInvitedUser(true)
      
      // Preencher email
      if (user.email) {
        console.log('Setando email:', user.email)
        setEmail(user.email)
      }
      
      // Função para validar se o nome é válido (não é email)
      const isValidName = (name: string | null | undefined): boolean => {
        if (!name) return false
        // Se parece com email, não é um nome válido
        if (name.includes('@')) return false
        return true
      }
      
      // Preencher nome do user_metadata
      let nameToSet = user.user_metadata?.full_name
      
      // Se não tem nome válido no metadata, buscar do profile no banco
      if (!isValidName(nameToSet)) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          
          console.log('Profile do banco:', profile)
          if (profile && isValidName(profile.full_name)) {
            nameToSet = profile.full_name
          } else {
            nameToSet = null // Não usar email como nome
          }
        } catch (err) {
          console.error('Erro ao buscar profile:', err)
        }
      }
      
      if (isValidName(nameToSet)) {
        console.log('Setando nome:', nameToSet)
        setFullName(nameToSet)
      }
    }

    const checkInvitedUser = async () => {
      try {
        // Verificar se há hash na URL (token do magic link/invite)
        const hash = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)
        
        console.log('Verificando convite - hash:', hash, 'search:', window.location.search)
        
        // Verificar se há erro no hash (link expirado, inválido, etc)
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1))
          const errorCode = hashParams.get('error_code')
          const errorDescription = hashParams.get('error_description')
          
          if (errorCode) {
            console.error('Erro no link:', errorCode, errorDescription)
            const message = errorCode === 'otp_expired' 
              ? 'O link expirou. Por favor, solicite um novo convite.'
              : (errorDescription?.replace(/\+/g, ' ') || 'Link inválido. Solicite um novo convite.')
            toast.error(message)
            // Limpar hash da URL
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }
        
        // Alguns links de convite usam query params ao invés de hash
        const accessTokenFromQuery = searchParams.get('access_token')
        const refreshTokenFromQuery = searchParams.get('refresh_token')
        
        if (hash && hash.includes('access_token')) {
          console.log('Token detectado no hash, processando...')
          
          // Extrair tokens do hash
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          console.log('accessToken extraído:', accessToken ? 'sim (length: ' + accessToken.length + ')' : 'não')
          
          if (accessToken) {
            // Decodificar JWT para extrair dados do usuário (não depende de setSession)
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]))
              console.log('JWT payload:', payload)
              
              const userId = payload.sub
              const userEmail = payload.email
              
              if (userId && userEmail) {
                console.log('Dados extraídos do JWT - userId:', userId, 'email:', userEmail)
                
                // Armazenar dados para uso no submit
                invitedUserDataRef.current = { userId, accessToken }
                console.log('invitedUserDataRef setado (JWT):', invitedUserDataRef.current)
                
                // Setar estado de usuário convidado
                setIsInvitedUser(true)
                setEmail(userEmail)
                
                // Tentar buscar nome do profile
                try {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', userId)
                    .single()
                  
                  if (profile?.full_name && !profile.full_name.includes('@')) {
                    setFullName(profile.full_name)
                  }
                } catch (e) {
                  console.log('Não foi possível buscar profile')
                }
                
                // Limpar hash da URL
                window.history.replaceState(null, '', window.location.pathname)
                return
              }
            } catch (jwtError) {
              console.error('Erro ao decodificar JWT:', jwtError)
            }
            
            // Fallback: tentar setSession (pode travar)
            console.log('Tentando setSession como fallback...')
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            
            if (!error && data.user) {
              console.log('Sessão estabelecida para:', data.user.email)
              invitedUserDataRef.current = { userId: data.user.id, accessToken }
              await fillUserData(data.user)
              window.history.replaceState(null, '', window.location.pathname)
              return
            }
          }
        } else if (accessTokenFromQuery) {
          console.log('Token detectado na query string, processando...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessTokenFromQuery,
            refresh_token: refreshTokenFromQuery || '',
          })
          
          if (error) {
            console.error('Erro ao definir sessão:', error)
            toast.error('Link expirado ou inválido. Solicite um novo convite.')
            return
          }
          
          if (data.user) {
            console.log('Sessão estabelecida para:', data.user.email)
            // IMPORTANTE: Armazenar userId e accessToken usando ref (síncrono)
            invitedUserDataRef.current = { userId: data.user.id, accessToken: accessTokenFromQuery }
            console.log('invitedUserDataRef setado (query):', invitedUserDataRef.current)
            await fillUserData(data.user)
            // Limpar query da URL
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }

        // Verificar se já tem sessão existente
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Sessão existente:', session?.user?.email)
        
        if (session?.user && session.access_token) {
          // Setar ref com dados da sessão existente
          invitedUserDataRef.current = { userId: session.user.id, accessToken: session.access_token }
          console.log('invitedUserDataRef setado (sessão existente):', invitedUserDataRef.current)
          await fillUserData(session.user)
          return
        }
        
        // Fallback: verificar se veio do callback com parâmetros na URL
        const invitedParam = searchParams.get('invited')
        const emailParam = searchParams.get('email')
        
        if (invitedParam === 'true' && emailParam) {
          console.log('Usuário convidado via parâmetros URL:', emailParam)
          setIsInvitedUser(true)
          setEmail(emailParam)
          // Limpar query da URL
          window.history.replaceState(null, '', window.location.pathname)
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      }
    }

    // Listener para mudanças de autenticação (captura quando o token é processado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user && session.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        // Setar ref com dados da sessão
        invitedUserDataRef.current = { userId: session.user.id, accessToken: session.access_token }
        console.log('invitedUserDataRef setado (onAuthStateChange):', invitedUserDataRef.current)
        await fillUserData(session.user)
      }
    })

    checkInvitedUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('handleEmailSignUp - isInvitedUser:', isInvitedUser, 'email:', email)

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // Se é usuário convidado, usar API admin para definir senha
      if (isInvitedUser) {
        // Usar dados armazenados do usuário convidado (ref é síncrono)
        const userData = invitedUserDataRef.current
        if (!userData) {
          console.error('invitedUserDataRef.current não disponível')
          setLoading(false)
          toast.error('Sessão expirada. Por favor, use o link de convite novamente.')
          return
        }

        console.log('Definindo senha para usuário com dados armazenados:', userData.userId)

        try {
          console.log('Chamando /api/members/set-password com token armazenado...')
          
          // Usar API admin para definir senha - passar userId e token diretamente
          const response = await fetchWithTimeout('/api/members/set-password', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.accessToken}`,
            },
            body: JSON.stringify({ 
              password, 
              full_name: fullName,
              user_id: userData.userId 
            }),
          })

          if (response.redirected) {
            throw new Error('Sua sessão não foi reconhecida pelo servidor. Abra novamente o link de convite e tente de novo.')
          }

          const contentType = response.headers.get('content-type') || ''
          const isJson = contentType.includes('application/json')

          const result = isJson
            ? await response.json().catch(() => ({}))
            : await response.text().catch(() => '')

          if (!isJson) {
            throw new Error('Resposta inesperada do servidor ao definir senha (não retornou JSON).')
          }

          console.log('Resultado set-password:', result)

          if (!response.ok) {
            throw new Error((result as any)?.error || 'Erro ao definir senha')
          }

          // Sucesso! Fazer login automático com a nova senha
          console.log('Senha definida, fazendo login automático...')
          
          const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()
          
          const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey!,
            },
            body: JSON.stringify({ email, password }),
          })
          
          const loginResult = await loginResponse.json()
          console.log('Resultado login automático:', loginResult.user?.email || loginResult.error_description)
          
          if (loginResponse.ok && loginResult.access_token) {
            // Configurar sessão no cliente Supabase (isso configura os cookies corretamente)
            await supabase.auth.setSession({
              access_token: loginResult.access_token,
              refresh_token: loginResult.refresh_token,
            })
            
            // Salvar perfil no localStorage
            localStorage.setItem('user_profile', JSON.stringify({
              id: loginResult.user.id,
              email: loginResult.user.email,
              full_name: fullName || loginResult.user.user_metadata?.full_name || loginResult.user.email?.split('@')[0] || 'Usuário',
              avatar_url: loginResult.user.user_metadata?.avatar_url || null,
              role: loginResult.user.user_metadata?.role || null,
              cliente_id: loginResult.user.user_metadata?.cliente_id || null,
              created_at: loginResult.user.created_at,
              updated_at: new Date().toISOString(),
            }))
            
            setLoading(false)
            toast.success('Senha definida e login realizado com sucesso!')
            router.push('/')
          } else {
            // Fallback: redirecionar para login se o login automático falhar
            setLoading(false)
            toast.success('Senha definida com sucesso! Faça login com sua nova senha.')
            window.location.href = '/login'
          }
        } catch (err: any) {
          console.error('Erro ao definir senha:', err)
          setLoading(false)
          const isAbort = err?.name === 'AbortError'
          toast.error(
            isAbort
              ? 'A operação demorou demais. Tente novamente.'
              : (err.message || 'Erro ao definir senha')
          )
        }
        return
      }

      // Fluxo normal de cadastro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      toast.success('Conta criada com sucesso! Verifique seu email.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: 'google' | 'apple' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || `Erro ao criar conta com ${provider}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black px-4 py-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <img
              src="/icone-azul.png"
              alt="NeoCRM Logo"
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            NeoCRM
          </h1>
          <p className="text-sm text-gray-300">
            Crie sua conta para começar
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-5 border border-gray-700">
          {/* OAuth Buttons */}
          {/* <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => handleOAuthSignUp('google')}
              className="flex items-center justify-center w-12 h-12 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
              title="Continuar com Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>

            <button
              onClick={() => handleOAuthSignUp('apple')}
              className="flex items-center justify-center w-12 h-12 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
              title="Continuar com Apple"
            >
              <Apple className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => handleOAuthSignUp('azure')}
              className="flex items-center justify-center w-12 h-12 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
              title="Continuar com Microsoft"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h10.931v10.931H0V0z" fill="#f25022"/>
                <path d="M12.069 0H23v10.931H12.069V0z" fill="#7fba00"/>
                <path d="M0 12.069h10.931V23H0V12.069z" fill="#00a4ef"/>
                <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#ffb900"/>
              </svg>
            </button>
          </div> */}

          {/* Divider */}
          {/* <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">Ou cadastre-se com email</span>
            </div>
          </div> */}

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 disabled:opacity-60"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isInvitedUser ? 'Definindo senha...' : 'Criando conta...') : (isInvitedUser ? 'Definir senha' : 'Criar conta')}
            </button>
          </form>

          {/* Sign In Link */}
          {/* <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Fazer login
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
