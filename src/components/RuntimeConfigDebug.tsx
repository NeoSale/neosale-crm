'use client';

import { useEffect, useState } from 'react';
import { getApiUrl, isRuntimeConfigLoaded, logRuntimeConfig } from '../utils/runtime-config';

interface RuntimeConfigDebugProps {
  show?: boolean;
}

export default function RuntimeConfigDebug({ show = false }: RuntimeConfigDebugProps) {
  const [config, setConfig] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Aguardar um pouco para o script carregar
    const timer = setTimeout(() => {
      const runtimeConfig = typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : null;
      setConfig(runtimeConfig);
      setApiUrl(getApiUrl());
      setIsLoaded(isRuntimeConfigLoaded());
      
      // Log para debug
      logRuntimeConfig();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Runtime Config Debug</h3>
      <div className="text-sm space-y-1">
        <div>
          <strong>Runtime Loaded:</strong> {isLoaded ? '✅' : '❌'}
        </div>
        <div>
          <strong>API URL:</strong> 
          <div className="break-all text-xs bg-gray-700 p-1 rounded mt-1">
            {apiUrl || 'Not loaded'}
          </div>
        </div>
        <div>
          <strong>Runtime Config:</strong>
          <pre className="text-xs bg-gray-700 p-1 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Process Env:</strong>
          <div className="text-xs bg-gray-700 p-1 rounded mt-1">
            {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
          </div>
        </div>
      </div>
    </div>
  );
}