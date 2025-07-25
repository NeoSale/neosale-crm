'use client';

import React from 'react';
import { leadsApi } from '../services/leadsApi';

const ToastTest: React.FC = () => {
  const testSuccess = async () => {
    console.log('Testing success scenario...');
    try {
      const result = await leadsApi.createMultipleLeads([
        { nome: 'Teste 1', email: 'teste1@email.com' },
        { nome: 'Teste 2', email: 'teste2@email.com' }
      ]);
      console.log('Success result:', result);
    } catch (error) {
      console.error('Error in success test:', error);
    }
  };

  const testError = async () => {
    console.log('Testing error scenario...');
    try {
      // Enviar mais de 5 leads para forçar erro
      const manyLeads = Array.from({ length: 6 }, (_, i) => ({
        nome: `Teste ${i + 1}`,
        email: `teste${i + 1}@email.com`
      }));
      const result = await leadsApi.createMultipleLeads(manyLeads);
      console.log('Error result:', result);
    } catch (error) {
      console.error('Error in error test:', error);
    }
  };

  const testInvalidData = async () => {
    console.log('Testing invalid data scenario...');
    try {
      // @ts-ignore - Forçar dados inválidos para teste
      const result = await leadsApi.createMultipleLeads(null);
      console.log('Invalid data result:', result);
    } catch (error) {
      console.error('Error in invalid data test:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Teste do Interceptor de Toast</h2>
      <div className="space-y-4">
        <button
          onClick={testSuccess}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Testar Sucesso (2 leads)
        </button>
        
        <button
          onClick={testError}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Testar Erro (6 leads - erro 500)
        </button>
        
        <button
          onClick={testInvalidData}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Testar Dados Inválidos (erro 400)
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Abra o console do navegador (F12) para ver os logs de debug.
          Os toasts devem aparecer no canto superior direito.
        </p>
      </div>
    </div>
  );
};

export default ToastTest;