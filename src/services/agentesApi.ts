// Serviço para integração com a API de Agentes

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { getClienteId } from '../utils/cliente-utils';
import { TipoAgente } from './tipoAgentesApi';

export interface Agente {
  id?: string;
  nome: string;
  tipo_agente_id: string;
  prompt?: string;
  agendamento?: boolean;
  prompt_agendamento?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relacionamento com tipo de agente
  tipo_agente?: TipoAgente;
  // Instâncias do Evolution API associadas ao agente
  instancias_evolution_api?: Array<{
    instanceName: string;
    profileName?: string;
    profilePictureUrl?: string;
    status?: string;
    owner?: string;
    id_agente?: string;
    followup?: boolean;
    qtd_envios_diarios?: number;
    [key: string]: any;
  }>;
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
  console.error('Erro na configuração da API de Agentes:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class AgentesApiService {
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

  // Buscar todos os agentes
  async getAgentes(): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>('/agentes', {
      method: 'GET',
    });
  }

  // Buscar agente por ID
  async getAgenteById(id: string): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'GET',
    });
  }

  // Criar novo agente
  async createAgente(agente: Omit<Agente, 'id'>): Promise<ApiResponse<Agente>> {
    return this.request<Agente>('/agentes', {
      method: 'POST',
      body: JSON.stringify(agente),
    }, {
      showSuccess: true,
      successMessage: 'Agente criado com sucesso!'
    });
  }

  // Atualizar agente
  async updateAgente(id: string, agente: Partial<Agente>): Promise<ApiResponse<Agente>> {
    const { agendamento, ativo, nome, prompt, prompt_agendamento, tipo_agente_id, updated_at } = agente;
    const agenteData = { agendamento, ativo, nome, prompt, prompt_agendamento, tipo_agente_id, updated_at };
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agenteData),
    }, {
      showSuccess: true,
      successMessage: 'Agente atualizado com sucesso!'
    });
  }

  // Excluir agente
  async deleteAgente(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agentes/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Agente excluído com sucesso!'
    });
  }

  // Ativar/Inativar agente
  async toggleAgenteAtivo(id: string, ativo: boolean): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ativo }),
    }, {
      showSuccess: true,
      successMessage: `Agente ${ativo ? 'ativado' : 'inativado'} com sucesso!`
    });
  }

  // Ativar/Inativar agendamento do agente
  async toggleAgenteAgendamento(id: string, agendamento: boolean): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ agendamento }),
    }, {
      showSuccess: true,
      successMessage: `Agendamento ${agendamento ? 'ativado' : 'inativado'} para o agente!`
    });
  }

  // Buscar agentes por tipo
  async getAgentesByTipo(tipoAgenteId: string): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>(`/agentes?tipo_agente_id=${tipoAgenteId}`, {
      method: 'GET',
    });
  }

  // Buscar agentes ativos
  async getAgentesAtivos(): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>('/agentes?ativo=true', {
      method: 'GET',
    });
  }
}

export const agentesApi = new AgentesApiService();
export default agentesApi;