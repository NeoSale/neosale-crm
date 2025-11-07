'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authApi';
import { validatePasswordStrength } from '../../utils/auth-utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ novaSenha?: string; confirmarSenha?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente');
      router.push('/forgot-password');
    }
  }, [token, router]);

  useEffect(() => {
    if (novaSenha) {
      const validation = validatePasswordStrength(novaSenha);
      setPasswordStrength(validation.strength);
    }
  }, [novaSenha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    const newErrors: { novaSenha?: string; confirmarSenha?: string } = {};

    if (!novaSenha.trim()) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (novaSenha.length < 6) {
      newErrors.novaSenha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (novaSenha !== confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authApi.resetPassword(token!, novaSenha);

      if (response.success) {
        setSuccess(true);
        toast.success('Senha redefinida com sucesso!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        toast.error(response.message || 'Erro ao redefinir senha');
      }
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao redefinir senha. Token pode estar expirado.';
      toast.error(errorMessage);
      
      if (errorMessage.includes('expirado') || errorMessage.includes('inválido')) {
        setTimeout(() => {
          router.push('/forgot-password');
        }, 2000);
      }
    } finally {
      setLoading(false);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4 py-4">
        <div className="w-full max-w-md">
          {/* Logo e Título */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-2">
              <img
                src="/icone-azul.png"
                alt="NeoCRM Logo"
                className="w-full h-full"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NeoCRM</h1>
          </div>

          {/* Card de Sucesso */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50">
            <div className="text-center">
              {/* Ícone de Sucesso */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Senha Redefinida!
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em alguns segundos.
              </p>

              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer"
              >
                Ir para Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4 py-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-2">
            <img
              src="/icone-azul.png"
              alt="NeoCRM Logo"
              className="w-full h-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NeoCRM</h1>
        </div>

        {/* Card de Reset */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Redefinir Senha
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Digite sua nova senha abaixo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nova Senha */}
            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="novaSenha"
                  type={showPassword ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    if (errors.novaSenha) setErrors({ ...errors, novaSenha: undefined });
                  }}
                  className={`block w-full pl-10 pr-12 py-2 border ${
                    errors.novaSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="••••••••"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {errors.novaSenha && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.novaSenha}
                </div>
              )}
              {novaSenha && !errors.novaSenha && (
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
                Confirmar Senha
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
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  disabled={loading}
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

            {/* Botão de Redefinir */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
