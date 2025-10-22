'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';
import { authApi, ConviteData } from '../../../services/authApi';

export default function ConvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<{
    nome?: string;
    senha?: string;
    confirmarSenha?: string;
  }>({});

  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      const response = await authApi.validateInvite(token);

      if (response.success) {
        setConvite(response.data);
        setEmail(response.data.email);
        setNome(response.data.nome || '');
        setTelefone(response.data.telefone || '');
      } else {
        setError(response.message || 'Convite inválido');
      }
    } catch (err: any) {
      console.error('Erro ao validar convite:', err);
      setError(err.response?.data?.message || 'Convite inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (!senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!convite) {
      toast.error('Convite inválido');
      return;
    }

    setSubmitting(true);

    try {
      // Hash da senha antes de enviar
      const salt = bcrypt.genSaltSync(10);
      const senhaHash = bcrypt.hashSync(senha, salt);

      // 1. Criar usuário
      const createUserResponse = await authApi.createUser({
        nome: nome.trim(),
        email: email.trim(),
        senha: senhaHash,
        telefone: telefone.trim() || undefined,
        perfil_id: convite.perfil_id,
        cliente_id: convite.cliente_id,
        revendedor_id: convite.revendedor_id,
        tipo_acesso_id: convite.tipo_acesso_id,
      });

      if (!createUserResponse.success) {
        toast.error(createUserResponse.message || 'Erro ao criar usuário');
        return;
      }

      // 2. Aceitar convite
      const acceptInviteResponse = await authApi.acceptInvite(convite.id, {
        usuario_criado_id: createUserResponse.data.id,
      });

      if (!acceptInviteResponse.success) {
        toast.error(acceptInviteResponse.message || 'Erro ao aceitar convite');
        return;
      }

      // 3. Fazer login (usando o hash da senha)
      const loginResponse = await authApi.login(email.trim(), senhaHash);

      if (loginResponse.success) {
        // Armazenar token e dados do usuário
        localStorage.setItem('token', loginResponse.data.sessao.token);
        localStorage.setItem('refresh_token', loginResponse.data.sessao.refresh_token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.usuario));

        toast.success('Cadastro realizado com sucesso!');

        // Redirecionar para a home
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        toast.error('Usuário criado, mas houve erro no login. Tente fazer login manualmente.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl p-6 text-center" style={{ boxShadow: '0 0 40px rgba(0, 0, 0, 0.15)' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-3">
            <img
              src="/icone-azul.png"
              alt="NeoCRM Logo"
              className="w-full h-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao NeoCRM!</h1>
          <p className="text-gray-600">Complete seu cadastro para começar</p>
        </div>

        {/* Mensagem Personalizada */}
        {convite.mensagem_personalizada && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">{convite.mensagem_personalizada}</p>
          </div>
        )}

        {/* Card de Cadastro */}
        <div className="bg-white rounded-xl p-6" style={{ boxShadow: '0 0 40px rgba(0, 0, 0, 0.15)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) setErrors({ ...errors, nome: undefined });
                  }}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                  placeholder="Seu nome completo"
                  disabled={submitting}
                />
              </div>
              {errors.nome && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.nome}
                </div>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="seu@email.com"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Campo Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="+55 11 99999-9999"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errors.senha) setErrors({ ...errors, senha: undefined });
                  }}
                  className={`block w-full pl-10 pr-12 py-2 border ${
                    errors.senha ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                  placeholder="Mínimo 6 caracteres"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.senha}
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmarSenha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => {
                    setConfirmarSenha(e.target.value);
                    if (errors.confirmarSenha) setErrors({ ...errors, confirmarSenha: undefined });
                  }}
                  className={`block w-full pl-10 pr-12 py-2 border ${
                    errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                  placeholder="Repita sua senha"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={submitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmarSenha && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmarSenha}
                </div>
              )}
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Criar Conta
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Já tem uma conta?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
