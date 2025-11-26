'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Chrome, Apple } from 'lucide-react'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

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
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
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
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="••••••••"
                />
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
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
