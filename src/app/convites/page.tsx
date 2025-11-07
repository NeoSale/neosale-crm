'use client';

import React, { useState } from 'react';
import { Mail, User, Send, AlertCircle, CheckCircle, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { inviteService, InviteUserData } from '../../services/inviteService';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export default function ConvitesPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [perfilId, setPerfilId] = useState('');
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('');

  // Form errors
  const [errors, setErrors] = useState<{
    email?: string;
    nome?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (nome.trim() && nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const inviteData: InviteUserData = {
        email: email.trim(),
        nome: nome.trim() || undefined,
        perfil_id: perfilId || undefined,
        mensagem_personalizada: mensagemPersonalizada.trim() || undefined,
      };

      const response = await inviteService.inviteUser(inviteData);

      if (response.success) {
        setSuccess(true);
        toast.success('Convite enviado com sucesso!');
        
        // Limpar formulário
        setTimeout(() => {
          setEmail('');
          setNome('');
          setPerfilId('');
          setMensagemPersonalizada('');
          setSuccess(false);
        }, 3000);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se usuário é admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas administradores podem enviar convites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Convidar Usuário
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Envie um convite por email para um novo usuário se juntar ao NeoCRM
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  Convite enviado!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Um email foi enviado para <strong>{email}</strong> com instruções para criar a conta.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Email do Usuário *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="usuario@exemplo.com"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {errors.email && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Nome Field */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nome Completo (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) setErrors({ ...errors, nome: undefined });
                  }}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="João da Silva"
                  disabled={loading}
                />
              </div>
              {errors.nome && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.nome}
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Se fornecido, será pré-preenchido no cadastro
              </p>
            </div>

            {/* Mensagem Personalizada */}
            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Mensagem Personalizada (Opcional)
              </label>
              <textarea
                id="mensagem"
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                placeholder="Adicione uma mensagem de boas-vindas ou instruções específicas..."
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Esta mensagem será exibida no email de convite
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Um email será enviado para o endereço fornecido</li>
                    <li>O usuário clicará no link para criar sua conta</li>
                    <li>Ele poderá definir sua própria senha</li>
                    <li>Após confirmar, terá acesso ao sistema</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Enviando convite...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Convite
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            O convite expira em 24 horas. Você pode reenviar se necessário.
          </p>
        </div>
      </div>
    </div>
  );
}
