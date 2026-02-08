'use client';

import { useEffect } from 'react';
import { VersionLogger } from '../utils/version';

/**
 * Componente para registrar a versão da aplicação no console do navegador
 */
export default function VersionLoggerComponent() {
  useEffect(() => {
    VersionLogger.logClientVersion();

    if (typeof window !== 'undefined') {
      (window as any).__APP_VERSION__ = VersionLogger.getAppInfo();
      localStorage.setItem('app_version', VersionLogger.getVersion());
    }
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
}