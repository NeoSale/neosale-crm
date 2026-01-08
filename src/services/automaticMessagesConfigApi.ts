import { getValidatedApiUrl } from '../utils/api-config';
import { getCurrentClienteId } from '../utils/cliente-utils';

const API_BASE_URL = getValidatedApiUrl();

export interface DiaHorarioEnvio {
  segunda: string;
  terca: string;
  quarta: string;
  quinta: string;
  sexta: string;
  sabado: string;
  domingo: string;
}

export interface AutomaticMessagesConfig {
  id: string;
  dia_horario_envio: DiaHorarioEnvio;
  qtd_envio_diario: number;
  em_execucao: boolean;
  ativo: boolean;
  cliente_id: string;
  embedding: any;
  created_at: string;
  updated_at: string;
  index: number;
}

export interface AutomaticMessagesConfigUpdate {
  dia_horario_envio: DiaHorarioEnvio;
  qtd_envio_diario: number;
  em_execucao: boolean;
  ativo: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class AutomaticMessagesConfigApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const cliente_id = getCurrentClienteId();
    
    if (!cliente_id) {
      return {
        success: false,
        error: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'cliente_id': cliente_id,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Erro na requisição',
        };
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async getConfig(): Promise<ApiResponse<AutomaticMessagesConfig>> {
    return this.request<AutomaticMessagesConfig>('/automatic-messages/configuracao');
  }

  async updateConfig(id: string, config: AutomaticMessagesConfigUpdate): Promise<ApiResponse<AutomaticMessagesConfig>> {
    return this.request<AutomaticMessagesConfig>(`/automatic-messages/configuracao/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

export const automaticMessagesConfigApi = new AutomaticMessagesConfigApiService();
