/**
 * Versão da aplicação extraída do package.json
 * Este arquivo é atualizado automaticamente durante o build
 * Última atualização: 2025-08-14T18:22:23.287Z
 */
export const APP_VERSION = '1.5.7';
export const APP_NAME = 'NeoSale CRM';

/**
 * Função para obter a versão da aplicação
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Função para obter o nome da aplicação
 */
export function getAppName(): string {
  return APP_NAME;
}

/**
 * Função para obter informações completas da aplicação
 */
export function getAppInfo() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    environment: process.env.NODE_ENV
  };
}
