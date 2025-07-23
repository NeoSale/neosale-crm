// Utilitário para acessar configurações de runtime

// Declarar o tipo global para a configuração runtime
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}

/**
 * Obtém a URL da API a partir da configuração runtime ou variável de ambiente
 * @returns URL da API
 */
export function getApiUrl(): string {
  // Primeiro, tentar obter da configuração runtime (para containers)
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_API_URL) {
    return window.__RUNTIME_CONFIG__.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback para variável de ambiente (para desenvolvimento)
  return process.env.NEXT_PUBLIC_API_URL || 'https://evolution-api-neosale-api.mrzt3w.easypanel.host/api';
}

/**
 * Obtém uma configuração específica
 * @param key Chave da configuração
 * @param defaultValue Valor padrão
 * @returns Valor da configuração
 */
export function getRuntimeConfig(key: string, defaultValue?: string): string | undefined {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    return (window.__RUNTIME_CONFIG__ as any)[key] || defaultValue;
  }
  
  return process.env[key] || defaultValue;
}

/**
 * Verifica se a configuração runtime está disponível
 * @returns true se a configuração runtime estiver carregada
 */
export function isRuntimeConfigLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.__RUNTIME_CONFIG__;
}

/**
 * Log das configurações para debug
 */
export function logRuntimeConfig(): void {
  if (typeof window !== 'undefined') {
    console.log('Runtime Config:', window.__RUNTIME_CONFIG__);
    console.log('API URL:', getApiUrl());
  }
}