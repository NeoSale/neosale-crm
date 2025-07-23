'use client';

import { useEffect } from 'react';
import { VersionLogger } from '../utils/version';

/**
 * Componente para registrar a versão da aplicação no console do navegador
 */
export default function VersionLoggerComponent() {
  useEffect(() => {
    // Exibir versão no console do navegador
    VersionLogger.logClientVersion();
    
    // Adicionar informações à janela global para debug
    if (typeof window !== 'undefined') {
      (window as any).__APP_VERSION__ = VersionLogger.getAppInfo();
    }
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
}