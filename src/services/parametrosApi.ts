// Serviço para integração com a API de Parâmetros

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { getClienteId } from '../utils/cliente-utils';
import { ParametroResponse, Parametro, ApiResponse } from '../types/parametro';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Parâmetros:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class ParametrosApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Validar se a API está configurada antes de fazer a requisição
      if (!API_BASE_URL) {
        const errorMessage = 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.';
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const clienteId = getClienteId();
      if (!clienteId) {
        const errorMessage = 'Cliente ID não encontrado. Verifique a configuração.';
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'cliente_id': clienteId,
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Erro na requisição: ${response.status} - ${errorText}`;
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada
      if (data && typeof data === 'object') {
        return data as ApiResponse<T>;
      }

      // Se não tem a estrutura esperada, envolver em uma resposta padrão
      return {
        success: true,
        data: data as T,
      };

    } catch (error) {
      console.error('Erro na requisição:', error);
      if (toastConfig?.showError !== false) {
        ToastInterceptor.handleError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
      throw error;
    }
  }

  /**
   * Busca um parâmetro por chave
   * @param chave - A chave do parâmetro a ser buscado
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o parâmetro encontrado
   */
  async getParametroByChave(chave: string, toastConfig?: ToastConfig): Promise<ApiResponse<Parametro>> {
    return this.request<Parametro>(`/parametros/chave/${chave}`, {
      method: 'GET',
    }, toastConfig);
  }

  /**
   * Busca todos os parâmetros
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com a lista de parâmetros
   */
  async getParametros(toastConfig?: ToastConfig): Promise<ApiResponse<Parametro[]>> {
    return this.request<Parametro[]>('/parametros', {
      method: 'GET',
    }, toastConfig);
  }

  /**
   * Cria um novo parâmetro
   * @param parametro - Dados do parâmetro a ser criado
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o parâmetro criado
   */
  async createParametro(parametro: Omit<Parametro, 'id' | 'created_at' | 'updated_at'>, toastConfig?: ToastConfig): Promise<ApiResponse<Parametro>> {
    return this.request<Parametro>('/parametros', {
      method: 'POST',
      body: JSON.stringify(parametro),
    }, toastConfig);
  }

  /**
   * Atualiza um parâmetro existente
   * @param id - ID do parâmetro a ser atualizado
   * @param parametro - Dados do parâmetro a serem atualizados
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o parâmetro atualizado
   */
  async updateParametro(id: string, parametro: Partial<Parametro>, toastConfig?: ToastConfig): Promise<ApiResponse<Parametro>> {
    return this.request<Parametro>(`/parametros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(parametro),
    }, toastConfig);
  }

  /**
   * Deleta um parâmetro
   * @param id - ID do parâmetro a ser deletado
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com resultado da operação
   */
  async deleteParametro(id: string, toastConfig?: ToastConfig): Promise<ApiResponse<void>> {
    return this.request<void>(`/parametros/${id}`, {
      method: 'DELETE',
    }, toastConfig);
  }

  /**
   * Salva ou atualiza um parâmetro por chave
   * @param chave - Chave do parâmetro
   * @param valor - Valor do parâmetro
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o parâmetro salvo
   */
  async saveParametroByChave(chave: string, valor: string, toastConfig?: ToastConfig): Promise<ApiResponse<Parametro>> {
    return this.request<Parametro>(`/parametros/chave/${encodeURIComponent(chave)}`, {
      method: 'POST',
      body: JSON.stringify({ chave, valor }),
    }, toastConfig);
  }
}

export const parametrosApi = new ParametrosApiService();
export default parametrosApi;