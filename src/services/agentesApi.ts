// Serviço para integração com a API de Agentes

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { TipoAgente } from './tipoAgentesApi';

export interface Agente {
  id?: string;
  nome: string;
  tipo_agente_id: string;
  prompt?: string;
  agendamento?: boolean;
  prompt_agendamento?: string;
  ativo?: boolean;
  base_id?: string[];
  created_at?: string;
  updated_at?: string;
  // Relacionamento com tipo de agente
  tipo_agente?: TipoAgente;
  // Instâncias do Evolution API associadas ao agente
  instancias_evolution_api?: Array<{
    id: string;
    instance_name: string;
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

  // Buscar todos os agentes
  async getAgentes(clienteId: string): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>('/agentes', {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Buscar agente por ID
  async getAgenteById(id: string, clienteId: string): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Criar novo agente
  async createAgente(agente: Omit<Agente, 'id'>, clienteId: string): Promise<ApiResponse<Agente>> {
    return this.request<Agente>('/agentes', {
      method: 'POST',
      body: JSON.stringify(agente),
    }, {
      showSuccess: true,
      successMessage: 'Agente criado com sucesso!'
    }, clienteId);
  }

  // Atualizar agente
  async updateAgente(id: string, agente: Partial<Agente>, clienteId: string): Promise<ApiResponse<Agente>> {
    const { agendamento, ativo, nome, prompt, prompt_agendamento, tipo_agente_id, base_id, updated_at } = agente;
    const agenteData = { agendamento, ativo, nome, prompt, prompt_agendamento, tipo_agente_id, base_id, updated_at };
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agenteData),
    }, {
      showSuccess: true,
      successMessage: 'Agente atualizado com sucesso!'
    }, clienteId);
  }

  // Excluir agente
  async deleteAgente(id: string, clienteId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/agentes/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Agente excluído com sucesso!'
    }, clienteId);
  }

  // Ativar/Inativar agente
  async toggleAgenteAtivo(id: string, ativo: boolean, clienteId: string): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ativo }),
    }, {
      showSuccess: true,
      successMessage: `Agente ${ativo ? 'ativado' : 'inativado'} com sucesso!`
    }, clienteId);
  }

  // Ativar/Inativar agendamento do agente
  async toggleAgenteAgendamento(id: string, agendamento: boolean, clienteId: string): Promise<ApiResponse<Agente>> {
    return this.request<Agente>(`/agentes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ agendamento }),
    }, {
      showSuccess: true,
      successMessage: `Agendamento ${agendamento ? 'ativado' : 'inativado'} para o agente!`
    }, clienteId);
  }

  // Buscar agentes por tipo
  async getAgentesByTipo(tipoAgenteId: string, clienteId: string): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>(`/agentes?tipo_agente_id=${tipoAgenteId}`, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Buscar agentes ativos
  async getAgentesAtivos(clienteId: string): Promise<ApiResponse<Agente[]>> {
    return this.request<Agente[]>('/agentes?ativo=true', {
      method: 'GET',
    }, undefined, clienteId);
  }
}

export const agentesApi = new AgentesApiService();
export default agentesApi;