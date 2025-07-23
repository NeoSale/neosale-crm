import { APP_NAME, APP_VERSION } from './app-version';
import { getApiUrl } from './runtime-config';

/**
 * Utilitário para exibir informações de versão da aplicação
 */
export class VersionLogger {
    private static readonly APP_NAME = APP_NAME;
    private static readonly VERSION = APP_VERSION;

    /**
     * Exibe a versão no console do servidor (Node.js)
     */
    static logServerVersion(): void {
        if (typeof window === 'undefined') {
            console.log('─'.repeat(50));
            console.log(`📦 Versão: ${this.VERSION}`);
            console.log(`🌐 Ambiente: ${process.env.NODE_ENV}`);
            console.log(`🔌 API Url: ${getApiUrl()}`);
            console.log('─'.repeat(50));
        }
    }

    /**
     * Exibe a versão no console do navegador (Client-side)
     */
    static logClientVersion(): void {
        if (typeof window !== 'undefined') {
            console.log(`%c🚀 ${this.APP_NAME} v${this.VERSION}`, 'color: #0070f3; font-weight: bold; font-size: 16px;');
            console.log(`%c📦 Versão: ${this.VERSION}`, 'color: #666; font-size: 12px;');
            console.log(`%c🌐 Ambiente: ${process.env.NODE_ENV}`, 'color: #666; font-size: 12px;');
            console.log('%c' + '─'.repeat(50), 'color: #ddd;');
        }
    }

    /**
     * Retorna a versão atual
     */
    static getVersion(): string {
        return this.VERSION;
    }

    /**
     * Retorna informações completas da aplicação
     */
    static getAppInfo(): { name: string; version: string; environment: string } {
        return {
            name: this.APP_NAME,
            version: this.VERSION,
            environment: process.env.NODE_ENV
        };
    }
}