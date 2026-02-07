/**
 * Utilitário para configuração e validação da API
 * Resiliente durante build-time (Next.js static generation)
 */

import { getApiUrl } from "./runtime-config";

// Placeholder URL for build-time (Next.js static generation)
const BUILD_TIME_PLACEHOLDER = 'https://placeholder.api.com';

/**
 * Checks if we're in a build/SSR context (not browser)
 */
function isBuildTime(): boolean {
  return typeof window === 'undefined';
}

/**
 * Obtém e valida a URL da API
 * Durante build-time retorna placeholder para não quebrar a geração estática
 * @returns URL válida da API
 */
export function getValidatedApiUrl(): string {
  const apiUrl = getApiUrl();

  // During build-time, return placeholder to not break static generation
  if (isBuildTime() && !apiUrl) {
    return BUILD_TIME_PLACEHOLDER;
  }

  // At runtime (browser), validate properly
  if (!apiUrl || apiUrl.trim() === '') {
    // In browser, this is a real error
    if (!isBuildTime()) {
      console.error('❌ NEXT_PUBLIC_API_URL não está configurada. Verifique suas variáveis de ambiente.');
    }
    return BUILD_TIME_PLACEHOLDER;
  }

  // Validate URL format
  try {
    new URL(apiUrl);
    return apiUrl;
  } catch {
    if (!isBuildTime()) {
      console.error(`❌ NEXT_PUBLIC_API_URL inválida: ${apiUrl}`);
    }
    return BUILD_TIME_PLACEHOLDER;
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

