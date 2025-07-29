'use client';

import { useEffect, useState } from 'react';
import { isApiConfigured } from '../utils/api-config';

/**
 * Componente que verifica a configuração da API no startup
 * e exibe avisos se necessário
 */
export default function ApiConfigChecker() {
  const [mounted, setMounted] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Verificar configuração da API
    const checkApiConfig = () => {
      const configured = isApiConfigured();
      setIsConfigured(configured);
      
      // Mostrar aviso se não configurada
      if (!configured) {
        setShowWarning(true);
        console.warn('⚠️ AVISO: API não configurada adequadamente!');
      }
    };

    checkApiConfig();
  }, []);

  // Evitar hidratação mismatch
  if (!mounted) {
    return null;
  }

  // Não renderizar nada se a API estiver configurada corretamente
  if (isConfigured === true) {
    return null;
  }

  // Não renderizar nada enquanto está verificando
  if (isConfigured === null) {
    return null;
  }

  // Renderizar aviso apenas se explicitamente solicitado e API não configurada
  if (!showWarning || isConfigured !== false) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">⚠️</span>
        <span className="font-medium">
          API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.
        </span>
        <button
          onClick={() => setShowWarning(false)}
          className="ml-4 px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}