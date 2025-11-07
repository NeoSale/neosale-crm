'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Super Admin Data
  const [adminNome, setAdminNome] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminConfirmarSenha, setAdminConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Primeiro Cliente Data
  const [clienteNome, setClienteNome] = useState('');
  const [clienteRazaoSocial, setClienteRazaoSocial] = useState('');
  const [clienteCnpj, setClienteCnpj] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');

  const [errors, setErrors] = useState<any>({});

  const validateStep1 = (): boolean => {
    const newErrors: any = {};

    if (!adminNome.trim()) {
      newErrors.adminNome = 'Nome é obrigatório';
    }

    if (!adminEmail.trim()) {
      newErrors.adminEmail = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      newErrors.adminEmail = 'Email inválido';
    }

    if (!adminSenha) {
      newErrors.adminSenha = 'Senha é obrigatória';
    } else if (adminSenha.length < 6) {
      newErrors.adminSenha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!adminConfirmarSenha) {
      newErrors.adminConfirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (adminSenha !== adminConfirmarSenha) {
      newErrors.adminConfirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: any = {};

    if (!clienteNome.trim()) {
      newErrors.clienteNome = 'Nome do cliente é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Criar Super Admin via API (mais confiável que trigger)
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminSenha,
          nome: adminNome,
          tipo_usuario: 'super_admin'
        })
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json();
        toast.error(errorData.message || 'Erro ao criar usuário');
        return;
      }

      const signupData = await signupResponse.json();
      
      if (!signupData.success) {
        toast.error(signupData.message || 'Erro ao criar usuário');
        return;
      }

      toast.success('Super Admin criado com sucesso!');

      // 2. Fazer login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminSenha
      });

      if (loginError) {
        toast.error('Usuário criado, mas erro ao fazer login. Tente fazer login manualmente.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // 4. Criar primeiro cliente (via API)
      if (clienteNome.trim()) {
        const response = await fetch('/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.session?.access_token}`
          },
          body: JSON.stringify({
            nome: clienteNome.trim(),
            razao_social: clienteRazaoSocial.trim() || undefined,
            cnpj: clienteCnpj.trim() || undefined,
            email: clienteEmail.trim() || undefined,
            telefone: clienteTelefone.trim() || undefined
          })
        });

        if (!response.ok) {
          console.error('Erro ao criar cliente');
        }
      }

      toast.success('Setup concluído com sucesso!');
      
      // Redirecionar para home
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error: any) {
      console.error('Erro no setup:', error);
      toast.error('Erro ao realizar setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img
              src="/icone-azul.png"
              alt="NeoCRM Logo"
              className="w-full h-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo ao NeoCRM! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure sua conta de Super Admin e crie seu primeiro cliente
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : '1'}
            </div>
            <div className={`w-24 h-1 mx-2 ${
              step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:shadow-gray-900/50 p-8">
          {/* Step 1: Super Admin */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Criar Super Admin
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Esta conta terá acesso total ao sistema
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={adminNome}
                  onChange={(e) => {
                    setAdminNome(e.target.value);
                    if (errors.adminNome) setErrors({ ...errors, adminNome: undefined });
                  }}
                  className={`block w-full px-3 py-2 border ${
                    errors.adminNome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Seu nome completo"
                  autoFocus
                />
                {errors.adminNome && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.adminNome}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (errors.adminEmail) setErrors({ ...errors, adminEmail: undefined });
                  }}
                  className={`block w-full px-3 py-2 border ${
                    errors.adminEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="admin@neosaleai.com"
                />
                {errors.adminEmail && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.adminEmail}
                  </div>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminSenha}
                    onChange={(e) => {
                      setAdminSenha(e.target.value);
                      if (errors.adminSenha) setErrors({ ...errors, adminSenha: undefined });
                    }}
                    className={`block w-full px-3 py-2 pr-12 border ${
                      errors.adminSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.adminSenha && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.adminSenha}
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={adminConfirmarSenha}
                    onChange={(e) => {
                      setAdminConfirmarSenha(e.target.value);
                      if (errors.adminConfirmarSenha) setErrors({ ...errors, adminConfirmarSenha: undefined });
                    }}
                    className={`block w-full px-3 py-2 pr-12 border ${
                      errors.adminConfirmarSenha ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Repita sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.adminConfirmarSenha && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.adminConfirmarSenha}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium"
              >
                Próximo
              </button>
            </form>
          )}

          {/* Step 2: Primeiro Cliente */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Criar Primeiro Cliente
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Adicione as informações do seu primeiro cliente (opcional)
                </p>
              </div>

              {/* Nome do Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={clienteNome}
                  onChange={(e) => {
                    setClienteNome(e.target.value);
                    if (errors.clienteNome) setErrors({ ...errors, clienteNome: undefined });
                  }}
                  className={`block w-full px-3 py-2 border ${
                    errors.clienteNome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Nome da empresa"
                  autoFocus
                />
                {errors.clienteNome && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.clienteNome}
                  </div>
                )}
              </div>

              {/* Razão Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Razão Social (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteRazaoSocial}
                  onChange={(e) => setClienteRazaoSocial(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Razão social da empresa"
                />
              </div>

              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteCnpj}
                  onChange={(e) => setClienteCnpj(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="contato@empresa.com"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteTelefone}
                  onChange={(e) => setClienteTelefone(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer font-medium"
                  disabled={loading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Concluir Setup
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>Você poderá adicionar mais clientes e usuários depois</p>
        </div>
      </div>
    </div>
  );
}
