'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@neosale/auth'
import { Profile, UserRole } from '@/types/auth'
import toast from 'react-hot-toast'
import {
  UserPlus,
  Trash2,
  Mail,
  RefreshCw,
  Users,
  Search,
  X
} from 'lucide-react'
import { useCliente } from '@/contexts/ClienteContext'
import { profilesApi } from '@/services/profilesApi'

export default function MembersPage() {
  const { selectedClienteId } = useCliente();
  const { profile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; memberId: string; memberEmail: string }>({ show: false, memberId: '', memberEmail: '' })

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin = profile?.role === 'admin' || isSuperAdmin

  // Função para recarregar membros
  const loadMembers = useCallback(async (clienteId: string | null) => {
    if (!clienteId) return

    setLoading(true)

    try {
      const data = await profilesApi.getProfiles(clienteId)
      setMembers(data || [])
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar membros quando o cliente mudar
  useEffect(() => {
    if (selectedClienteId) {
      loadMembers(selectedClienteId)
    }
  }, [selectedClienteId, loadMembers])

  const handleInviteMember = async (email: string, role: UserRole, fullName: string) => {
    if (!selectedClienteId) return
    try {
      await profilesApi.inviteMember(email, role, selectedClienteId, fullName)
      toast.success('Convite enviado com sucesso!')
      setShowInviteModal(false)
      loadMembers(selectedClienteId)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite')
    }
  }

  const handleResendInvite = async (email: string) => {
    try {
      await profilesApi.resendInvite(email)
      toast.success('Convite reenviado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reenviar convite')
    }
  }

  const handleResetPassword = async (email: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      toast.success('Email de redefinição enviado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de redefinição')
    }
  }

  const openDeleteModal = (memberId: string, memberEmail: string) => {
    setDeleteModal({ show: true, memberId, memberEmail })
  }

  const handleDeleteMember = async () => {
    const { memberId } = deleteModal
    try {
      await profilesApi.deleteProfile(memberId)
      toast.success('Membro removido com sucesso!')
      setDeleteModal({ show: false, memberId: '', memberEmail: '' })
      loadMembers(selectedClienteId)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover membro')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: UserRole) => {
    try {
      await profilesApi.updateRole(memberId, newRole)
      toast.success('Perfil atualizado com sucesso!')
      loadMembers(selectedClienteId)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil')
    }
  }

  const filteredMembers = members.filter(member =>
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrador',
      member: 'Membro',
      viewer: 'Visualizador',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || styles.viewer}`}>
        {labels[role] || role}
      </span>
    )
  }

  // Aguardar carregamento do perfil
  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Membros</h1>
        <p className="text-gray-600">Gerencie os membros da equipe</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar membros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Convidar Membro
        </button>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Carregando membros...</span>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum membro encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece convidando membros para sua equipe'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Entrada
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.full_name || 'Sem nome'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isSuperAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as UserRole)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={member.role === 'super_admin'}
                      >
                        <option value="admin">Administrador</option>
                        <option value="member">Membro</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      getRoleBadge(member.role)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResendInvite(member.email)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Reenviar convite"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(member.email)}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Resetar senha"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {member.role !== 'super_admin' && (
                        <button
                          onClick={() => openDeleteModal(member.id, member.email)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remover membro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <DeleteConfirmModal
          memberEmail={deleteModal.memberEmail}
          onClose={() => setDeleteModal({ show: false, memberId: '', memberEmail: '' })}
          onConfirm={handleDeleteMember}
        />
      )}
    </div>
  )
}

function InviteModal({
  onClose,
  onInvite
}: {
  onClose: () => void
  onInvite: (email: string, role: UserRole, fullName: string) => void
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onInvite(email, role, fullName)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Convidar Membro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              id="invite-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-2">
              Perfil
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">Visualizador</option>
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {role === 'admin' && 'Pode gerenciar membros e configurações'}
              {role === 'member' && 'Pode criar e editar conteúdo'}
              {role === 'viewer' && 'Pode apenas visualizar'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  memberEmail,
  onClose,
  onConfirm
}: {
  memberEmail: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Remover Membro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Tem certeza que deseja remover <strong>{memberEmail}</strong> da equipe?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            O usuário será desvinculado do cliente, mas sua conta continuará existindo.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </div>
  )
}
