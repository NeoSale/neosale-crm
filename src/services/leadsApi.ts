// Serviço para integração com a API de Leads

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';

export interface Lead {
  id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  status?: string;
  contador?: string;
  escritorio?: string;
  responsavel?: string;
  cnpj?: string;
  observacao?: string;
  segmento?: string;
  erp_atual?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Leads:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class LeadsApiService {
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
        headers: finalHeaders,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Erro HTTP: ${response.status}`;
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage, toastConfig);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Mostrar toast de sucesso se configurado
      if (result.success && toastConfig?.showSuccess !== false) {
        const successMessage = result.message || toastConfig?.successMessage;
        if (successMessage) {
          ToastInterceptor.handleSuccess(successMessage, toastConfig);
        }
      }
      
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      return {
        data: null as T,
        message: errorMessage,
        success: false,
      };
    }
  }

  // Buscar todos os leads
  async getLeads(cliente_id?: string): Promise<ApiResponse<Lead[]>> {
    const headers: Record<string, string> = {};

    if (cliente_id) {
      headers['cliente_id'] = cliente_id;
    }
    
    const requestOptions: RequestInit = {
      method: 'GET',
      headers
    };
    
    return this.request<Lead[]>('/leads', requestOptions, {
      showSuccess: false, // Não mostrar toast para busca
      showError: true,
    });
  }

  // Buscar lead por ID
  async getLeadById(id: string): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {}, {
      showSuccess: false, // Não mostrar toast para busca
      showError: true,
    });
  }

  // Criar novo lead
  async createLead(lead: Omit<Lead, 'id'>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Lead criado com sucesso!',
    });
  }

  // Criar múltiplos leads (para importação)
  async createMultipleLeads(leads: Omit<Lead, 'id'>[]): Promise<ApiResponse<Lead[]>> {
    return this.request<Lead[]>('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: `${leads.length} leads importados com sucesso!`,
    });
  }

  // Atualizar lead
  async updateLead(id: string, lead: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lead),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Lead atualizado com sucesso!',
    });
  }

  // Deletar lead
  async deleteLead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/leads/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Lead excluído com sucesso!',
    });
  }

  // Buscar leads com filtros
  async searchLeads(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ leads: Lead[]; total: number; page: number; limit: number }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/leads/search?${queryString}` : '/leads/search';
    
    return this.request<{ leads: Lead[]; total: number; page: number; limit: number }>(endpoint, {}, {
      showSuccess: false, // Não mostrar toast para pesquisa
      showError: true,
    });
  }


}

export const leadsApi = new LeadsApiService();
export default leadsApi;