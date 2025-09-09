// Serviço para integração com a API de Tipos de Agentes

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';


export interface TipoAgente {
  id?: string;
  nome: string;
  ativo?: boolean;
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
  console.error('Erro na configuração da API de Tipos de Agentes:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class TipoAgentesApiService {


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
        'Content-Type': 'application/json',
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

  // Buscar todos os tipos de agentes
  async getTipoAgentes(): Promise<ApiResponse<TipoAgente[]>> {
    return this.request<TipoAgente[]>('/tipos-agente', {
      method: 'GET',
    });
  }

  // Buscar tipo de agente por ID
  async getTipoAgenteById(id: string): Promise<ApiResponse<TipoAgente>> {
    return this.request<TipoAgente>(`/tipos-agente/${id}`, {
      method: 'GET',
    });
  }

  // Criar novo tipo de agente
  async createTipoAgente(tipoAgente: Omit<TipoAgente, 'id'>): Promise<ApiResponse<TipoAgente>> {
    return this.request<TipoAgente>('/tipos-agente', {
      method: 'POST',
      body: JSON.stringify(tipoAgente),
    }, {
      showSuccess: true,
      successMessage: 'Tipo de agente criado com sucesso!'
    });
  }

  // Atualizar tipo de agente
  async updateTipoAgente(id: string, tipoAgente: Partial<TipoAgente>): Promise<ApiResponse<TipoAgente>> {
    return this.request<TipoAgente>(`/tipos-agente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipoAgente),
    }, {
      showSuccess: true,
      successMessage: 'Tipo de agente atualizado com sucesso!'
    });
  }

  // Excluir tipo de agente
  async deleteTipoAgente(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tipos-agente/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Tipo de agente excluído com sucesso!'
    });
  }

  // Ativar/Inativar tipo de agente
  async toggleTipoAgenteAtivo(id: string, ativo: boolean): Promise<ApiResponse<TipoAgente>> {
    return this.request<TipoAgente>(`/tipos-agente/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ativo }),
    }, {
      showSuccess: true,
      successMessage: `Tipo de agente ${ativo ? 'ativado' : 'inativado'} com sucesso!`
    });
  }
}

export const tipoAgentesApi = new TipoAgentesApiService();
export default tipoAgentesApi;