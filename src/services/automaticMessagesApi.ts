// Serviço para integração com a API de Automatic Messages

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { getCurrentClienteId } from '../utils/cliente-utils';

export interface EstatisticasPorDia {
  data: string;
  qtd_sucesso: number;
  qtd_erro: number;
  total: number;
}

export interface DetalheAutomaticMessages {
  id_lead: string;
  nome_lead: string;
  telefone_lead: string;
  horario: string;
  status: 'sucesso' | 'erro';
  mensagem_enviada: string;
  mensagem_erro: string | null;
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
  console.error('Erro na configuração da API de Automatic Messages:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class AutomaticMessagesApiService {
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig
  ): Promise<ApiResponse<T>> {
    try {
      if (!API_BASE_URL) {
        throw new Error('URL da API não configurada');
      }

      const cliente_id = getCurrentClienteId();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Adicionar cliente_id ao header se disponível
      if (cliente_id) {
        headers['cliente_id'] = cliente_id;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || `Erro HTTP: ${response.status}`;
        
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage, toastConfig);
        }
        
        throw new Error(errorMessage);
      }

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

  async getEstatisticasPorDia(): Promise<ApiResponse<EstatisticasPorDia[]>> {
    return this.request<EstatisticasPorDia[]>('/automatic-messages/estatisticas-por-dia', {
      method: 'GET',
    });
  }

  async getDetalhesPorData(data: string): Promise<ApiResponse<DetalheAutomaticMessages[]>> {
    return this.request<DetalheAutomaticMessages[]>(`/automatic-messages/detalhes-por-data?data=${data}`, {
      method: 'GET',
    });
  }
}

export const automaticMessagesApi = new AutomaticMessagesApiService();
export default automaticMessagesApi;
