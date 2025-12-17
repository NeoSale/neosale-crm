// Utilitário para acessar configurações
// Next.js substitui process.env.NEXT_PUBLIC_* em tempo de build
// Para Docker, as variáveis devem ser passadas em build-time via --build-arg

/**
 * Obtém a URL da API a partir da variável de ambiente
 * @returns URL da API
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

/**
 * Obtém uma configuração específica
 * @param key Chave da configuração
 * @param defaultValue Valor padrão
 * @returns Valor da configuração
 */
export function getRuntimeConfig(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Verifica se a API URL está configurada
 * @returns true se a API URL estiver configurada
 */
export function isApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_API_URL;
}

/**
 * Log das configurações para debug
 */
export function logConfig(): void {
  console.log('API URL:', getApiUrl());
}