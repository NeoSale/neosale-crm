// Serviço para integração com a API de Bases

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';

export interface Base {
  id?: string;
  nome: string;
  descricao?: string;
  cliente_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: PaginationData;
  errors?: any[];
}

export interface ListBasesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Bases:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class BasesApiService {
  private getHeaders(clienteId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig,
    clienteId?: string
  ): Promise<ApiResponse<T>> {
    try {
      // Validar se a API está configurada antes de fazer a requisição
      if (!API_BASE_URL) {
        const errorMessage = 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.';
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage, toastConfig);
        }
        throw new Error(errorMessage);
      }

      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      // Validar se cliente_id está presente
      if (!clienteId) {
        throw new Error('Header cliente_id é obrigatório');
      }

      const finalHeaders = {
        ...this.getHeaders(clienteId),
        ...options.headers,
      };

      const response = await fetch(fullUrl, {
        ...options,
        headers: finalHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar a mensagem padrão
        }

        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage, toastConfig);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (toastConfig?.showSuccess && data.success) {
        ToastInterceptor.handleSuccess(data.message || 'Operação realizada com sucesso!', toastConfig);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      if (toastConfig?.showError !== false) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        ToastInterceptor.handleError(errorMessage, toastConfig);
      }
      throw error;
    }
  }

  // Buscar todas as bases com paginação e busca
  async getBases(params?: ListBasesParams, clienteId?: string): Promise<ApiResponse<{ bases: Base[]; pagination: PaginationData }>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/base${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.request<{ bases: Base[]; pagination: PaginationData }>(endpoint, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Buscar base por ID
  async getBaseById(id: string, clienteId: string): Promise<ApiResponse<Base>> {
    return this.request<Base>(`/base/${id}`, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Criar nova base
  async createBase(base: Omit<Base, 'id'>, clienteId: string): Promise<ApiResponse<Base>> {
    return this.request<Base>('/base', {
      method: 'POST',
      body: JSON.stringify(base),
    }, {
      showSuccess: true,
      successMessage: 'Base criada com sucesso!'
    }, clienteId);
  }

  // Atualizar base
  async updateBase(id: string, base: Partial<Base>, clienteId: string): Promise<ApiResponse<Base>> {
    const { nome, descricao, cliente_id } = base;
    const baseData = { nome, descricao, cliente_id };
    return this.request<Base>(`/base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(baseData),
    }, {
      showSuccess: true,
      successMessage: 'Base atualizada com sucesso!'
    }, clienteId);
  }

  // Excluir base
  async deleteBase(id: string, clienteId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/base/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Base excluída com sucesso!'
    }, clienteId);
  }
}

export const baseApi = new BasesApiService();
export default baseApi;