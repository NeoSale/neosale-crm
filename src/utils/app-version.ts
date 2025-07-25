/**
 * Versão da aplicação extraída do package.json
 * Este arquivo é atualizado automaticamente durante o build
 * Última atualização: 2025-07-24T23:11:10.314Z
 */
export const APP_VERSION = '0.3.24';
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
