'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/authApi';
import { isValidEmail } from '../../utils/auth-utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email);

      if (response.success) {
        setEmailSent(true);
        toast.success('Email enviado com sucesso!');
      } else {
        toast.error(response.message || 'Erro ao enviar email');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar reset de senha:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao enviar email. Tente novamente.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
                Email Enviado!
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Enviamos um link para redefinir sua senha para <strong>{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Importante:</strong> O link expira em 1 hora.
                </p>
              </div>

              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer"
              >
                Voltar para Login
              </button>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Não recebeu o email? Enviar novamente
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

        {/* Card de Recuperação */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl dark:shadow-gray-900/50">
          {/* Botão Voltar */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para login
          </button>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Email
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
                    if (error) setError('');
                  }}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  placeholder="seu@email.com"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
