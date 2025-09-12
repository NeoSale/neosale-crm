// Serviço para integração com a API de Bases

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { getClienteId } from '../utils/cliente-utils';

export interface Base {
  id?: string;
  nome: string;
  descricao?: string;
  cliente_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  total?: number;
  errors?: any[];
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
  private getHeaders(): Record<string, string> {
    const clienteId = getClienteId();
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
    toastConfig?: ToastConfig
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
      
      const finalHeaders = {
        ...this.getHeaders(),
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

  // Buscar todas as bases
  async getBases(): Promise<ApiResponse<Base[]>> {
    return this.request<Base[]>('/base', {
      method: 'GET',
    });
  }

  // Buscar base por ID
  async getBaseById(id: string): Promise<ApiResponse<Base>> {
    return this.request<Base>(`/base/${id}`, {
      method: 'GET',
    });
  }

  // Criar nova base
  async createBase(base: Omit<Base, 'id'>): Promise<ApiResponse<Base>> {
    return this.request<Base>('/base', {
      method: 'POST',
      body: JSON.stringify(base),
    }, {
      showSuccess: true,
      successMessage: 'Base criada com sucesso!'
    });
  }

  // Atualizar base
  async updateBase(id: string, base: Partial<Base>): Promise<ApiResponse<Base>> {
    const { nome, descricao, cliente_id } = base;
    const baseData = { nome, descricao, cliente_id };
    return this.request<Base>(`/base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(baseData),
    }, {
      showSuccess: true,
      successMessage: 'Base atualizada com sucesso!'
    });
  }

  // Excluir base
  async deleteBase(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/base/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Base excluída com sucesso!'
    });
  }
}

export const baseApi = new BasesApiService();
export default baseApi;