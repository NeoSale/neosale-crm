'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { validatePasswordStrength } from '../../../utils/auth-utils';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  
  const [errors, setErrors] = useState<{
    nome?: string;
    senha?: string;
    confirmarSenha?: string;
  }>({});

  const [userMetadata, setUserMetadata] = useState<any>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  useEffect(() => {
    if (senha) {
      const validation = validatePasswordStrength(senha);
      setPasswordStrength(validation.strength);
    }
  }, [senha]);

  const handleAuthCallback = async () => {
    try {
      setLoading(true);

      // Verificar se há hash na URL (convite aceito)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (type === 'invite' && accessToken) {
        // Usuário aceitou convite, obter sessão
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (sessionError) {
          setError('Link de convite inválido ou expirado');
          setLoading(false);
          return;
        }

        // Obter metadados do usuário
        if (session?.user) {
          setUserMetadata(session.user.user_metadata);
          setNome(session.user.user_metadata.nome || '');
        }

        setLoading(false);
      } else {
        // Verificar se já tem sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Já autenticado, redirecionar
          router.push('/');
        } else {
          setError('Link inválido ou expirado');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Erro no callback:', err);
      setError('Erro ao processar convite');
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

    setSubmitting(true);

    try {
      // Atualizar senha e nome do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: senha,
        data: {
          nome: nome.trim(),
          email_verificado: true,
          ativo: true
        }
      });

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      setSuccess(true);
      toast.success('Conta criada com sucesso!');

      // Redirecionar para home
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setSubmitting(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'Forte';
      case 'medium':
        return 'Média';
      default:
        return 'Fraca';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Convite Inválido</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Conta Criada!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sua conta foi criada com sucesso. Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bem-vindo ao NeoCRM!</h1>
          <p className="text-gray-600 dark:text-gray-300">Complete seu cadastro para começar</p>
        </div>

        {/* Mensagem Personalizada */}
        {userMetadata?.mensagem_personalizada && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-300 text-sm">{userMetadata.mensagem_personalizada}</p>
          </div>
        )}

        {/* Card de Cadastro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nome Completo *
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
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="Seu nome completo"
                  disabled={submitting}
                  autoFocus
                />
              </div>
              {errors.nome && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.nome}
                </div>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
                    errors.senha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="Mínimo 6 caracteres"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.senha}
                </div>
              )}
              {senha && !errors.senha && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Força da senha:</span>
                    <span className={`font-medium ${
                      passwordStrength === 'strong' ? 'text-green-600 dark:text-green-400' :
                      passwordStrength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${getStrengthColor()}`}
                      style={{
                        width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '66%' : '33%'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Confirmar Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
                    errors.confirmarSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="Repita sua senha"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  disabled={submitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.confirmarSenha && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmarSenha}
                </div>
              )}
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
      </div>
    </div>
  );
}
