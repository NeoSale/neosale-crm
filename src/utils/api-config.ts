/**
 * Utilitário para configuração e validação da API
 */

/**
 * Obtém e valida a URL da API
 * @returns URL válida da API
 * @throws Error se a URL não estiver configurada adequadamente
 */
export function getValidatedApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Verificar se a variável está definida
  if (!apiUrl) {
    const errorMsg = '❌ NEXT_PUBLIC_API_URL não está configurada. Verifique suas variáveis de ambiente.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Verificar se não é uma string vazia
  if (apiUrl.trim() === '') {
    const errorMsg = '❌ NEXT_PUBLIC_API_URL está vazia. Configure uma URL válida.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // Verificar se é uma URL válida
  try {
    new URL(apiUrl);
    return apiUrl;
  } catch (error) {
    const errorMsg = `❌ NEXT_PUBLIC_API_URL inválida: ${apiUrl}. Configure uma URL válida (ex: https://api.exemplo.com)`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Obtém a URL da API com fallback seguro
 * @param fallbackUrl URL de fallback (opcional)
 * @returns URL da API ou fallback
 */
export function getApiUrlWithFallback(fallbackUrl?: string): string {
  try {
    return getValidatedApiUrl();
  } catch (error) {
    if (fallbackUrl) {
      console.warn(`⚠️ Usando URL de fallback: ${fallbackUrl}`);
      return fallbackUrl;
    }
    
    // Re-throw o erro se não há fallback
    throw error;
  }
}

/**
 * Verifica se a API está configurada corretamente
 * @returns true se a API está configurada, false caso contrário
 */
export function isApiConfigured(): boolean {
  try {
    getValidatedApiUrl();
    return true;
  } catch {
    return false;
  }
}

/**
 * Log de informações da configuração da API
 */
export function logApiConfig(): void {
  try {
    const apiUrl = getValidatedApiUrl();
    console.log('✅ API configurada:', apiUrl);
  } catch (error) {
    console.error('❌ Erro na configuração da API:', error instanceof Error ? error.message : 'Erro desconhecido');
  }
}