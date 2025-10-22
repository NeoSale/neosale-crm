'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Acesso Negado</h1>

        {/* Descrição */}
        <p className="text-lg text-gray-600 mb-8">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador do
          sistema se você acredita que isso é um erro.
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir para Início
          </button>
        </div>

        {/* Informação adicional */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Código:</strong> 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
  );
}
