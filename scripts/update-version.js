#!/usr/bin/env node

/**
 * Script para atualizar a versão da aplicação no arquivo app-version.ts
 * baseado no package.json
 */

const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionFilePath = path.join(__dirname, '..', 'src', 'utils', 'app-version.ts');

try {
  // Ler package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  const name = packageJson.name || 'NeoCRM';

  // Conteúdo do arquivo app-version.ts
  const versionFileContent = `/**
 * Versão da aplicação extraída do package.json
 * Este arquivo é atualizado automaticamente durante o build
 * Última atualização: ${new Date().toISOString()}
 */
export const APP_VERSION = '${version}';
export const APP_NAME = 'NeoCRM';

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
`;

  // Escrever o arquivo
  fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');  
} catch (error) {
  console.error('❌ Erro ao atualizar versão:', error.message);
  process.exit(1);
}