'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, Lock, Chrome, Apple } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Login realizado com sucesso!')
      router.push('/')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || `Erro ao fazer login com ${provider}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/icone-azul.png"
              alt="NeoSale Logo"
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            NeoSale CRM
          </h1>
          <p className="text-gray-300">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
            >
              <Chrome className="w-5 h-5 text-gray-300" />
              <span className="text-gray-200 font-medium">Continuar com Google</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('apple')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
            >
              <Apple className="w-5 h-5 text-gray-300" />
              <span className="text-gray-200 font-medium">Continuar com Apple</span>
            </button>

            <button
              onClick={() => handleOAuthLogin('azure')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors bg-gray-900"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h10.931v10.931H0V0z" fill="#f25022"/>
                <path d="M12.069 0H23v10.931H12.069V0z" fill="#7fba00"/>
                <path d="M0 12.069h10.931V23H0V12.069z" fill="#00a4ef"/>
                <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#ffb900"/>
              </svg>
              <span className="text-gray-200 font-medium">Continuar com Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">Ou continue com email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/reset-password"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
