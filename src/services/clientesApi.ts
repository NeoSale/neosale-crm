import { getValidatedApiUrl } from '../utils/api-config';
import { getCurrentClienteId } from '../utils/cliente-utils';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ClientesApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: { showSuccess?: boolean; showError?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${getValidatedApiUrl()}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || `Erro ${response.status}: ${response.statusText}`;
        return {
          success: false,
          message: errorMessage,
          error: data.error || 'Erro na requisição'
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('Erro na requisição:', error);
      return {
        success: false,
        message: 'Erro de conexão com o servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Buscar todos os clientes
  async getClientes(): Promise<ApiResponse<Cliente[]>> {
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    return this.request<Cliente[]>('/clientes/all', requestOptions, {
      showSuccess: false, // Não mostrar toast para busca
      showError: true,
    });
  }
}

export const clientesApi = new ClientesApiService();