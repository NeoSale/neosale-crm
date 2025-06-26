// Serviço para integração com a API de Leads

import ToastInterceptor, { ToastConfig } from './toastInterceptor';

export interface Lead {
  id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  status?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

const API_BASE_URL = 'http://localhost:3000/api';

class LeadsApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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
  async getLeads(): Promise<ApiResponse<Lead[]>> {
    return this.request<Lead[]>('/leads', {}, {
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

  // Obter estatísticas dos leads
  async getLeadsStats(): Promise<ApiResponse<{
    total: number;
    withEmail: number;
    qualified: number;
    new: number;
    byStatus: Record<string, number>;
  }>> {
    try {
      return await this.request<{
        total: number;
        withEmail: number;
        qualified: number;
        new: number;
        byStatus: Record<string, number>;
      }>('/leads/stats', {}, {
        showSuccess: false, // Não mostrar toast para estatísticas
        showError: true,
      });
    } catch (error) {
      return {
        data: {
          total: 0,
          withEmail: 0,
          qualified: 0,
          new: 0,
          byStatus: {},
        },
        message: 'Erro ao buscar estatísticas',
        success: false,
      };
    }
  }
}

export const leadsApi = new LeadsApiService();
export default leadsApi;