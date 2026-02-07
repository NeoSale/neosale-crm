'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@neosale/auth'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { UserCircle, Mail, User, Shield, Save, Loader2 } from 'lucide-react'

export default function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      // Atualizar email se mudou
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        })

        if (emailError) throw emailError
        toast.success('Email atualizado! Verifique seu email para confirmar.')
      }

      await refreshProfile()
      toast.success('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error(error.message || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (role: string) => {
    // Retorna o nome exatamente como está no banco
    return role
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Meu Perfil
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gerencie suas informações pessoais
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Perfil/Role - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Perfil
              </div>
            </label>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${getRoleColor(profile?.role!)}`}>
                {getRoleName(profile?.role!)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (Somente administradores podem alterar perfis)
              </span>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </div>
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite seu nome completo"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </div>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ao alterar o email, você receberá um link de confirmação
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                URL do Avatar
              </div>
            </label>
            <input
              type="url"
              id="avatar_url"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com/avatar.jpg"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL da sua foto de perfil (opcional)
            </p>
          </div>

          {/* Preview do Avatar */}
          {formData.avatar_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.avatar_url}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Prévia da imagem
                </span>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                if (profile) {
                  setFormData({
                    full_name: profile.full_name || '',
                    email: profile.email || '',
                    avatar_url: profile.avatar_url || '',
                  })
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>

        {/* Informações Adicionais */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Informações da Conta
          </h3>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <span className="font-medium">ID:</span> {user?.id}
            </p>
            <p>
              <span className="font-medium">Criado em:</span>{' '}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-'}
            </p>
            <p>
              <span className="font-medium">Última atualização:</span>{' '}
              {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
