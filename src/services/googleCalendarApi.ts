// Serviço para integração com a API de Google Calendar

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';

export interface GoogleCalendarIntegracao {
  id?: string;
  nome: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  ativo: boolean;
  cliente_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGoogleCalendarIntegracao {
  nome: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  ativo: boolean;
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
  console.error('Erro na Integração da API de Google Calendar:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class GoogleCalendarApiService {
  // Método para agrupar erros similares
  private groupSimilarErrors(errors: string[]): string[] {
    const errorGroups: { [key: string]: number } = {};
    
    errors.forEach(error => {
      const normalizedError = error.toLowerCase().trim();
      errorGroups[normalizedError] = (errorGroups[normalizedError] || 0) + 1;
    });

    return Object.entries(errorGroups).map(([error, count]) => {
      if (count > 1) {
        return `${error} (${count}x)`;
      }
      return error;
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig
  ): Promise<ApiResponse<T>> {
    try {
      if (!API_BASE_URL) {
        throw new Error('URL da API não configurada. Verifique as Integrações do sistema.');
      }

      const url = `${API_BASE_URL}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      let data: ApiResponse<T>;
      
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta JSON:', parseError);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        let errorMessage = 'Erro na requisição';
        
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const groupedErrors = this.groupSimilarErrors(data.errors);
          errorMessage = groupedErrors.join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        } else if (response.status === 404) {
          errorMessage = 'Recurso não encontrado';
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor';
        } else if (response.status === 401) {
          errorMessage = 'Não autorizado';
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado';
        }

        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      if (toastConfig?.showSuccess && data.message) {
        ToastInterceptor.handleSuccess(data.message);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      
      if (toastConfig?.showError !== false) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na requisição';
        ToastInterceptor.handleError(errorMessage);
      }
      
      throw error;
    }
  }

  // Listar todas as Integrações do Google Calendar
  async listarConfiguracoes(cliente_id?: string): Promise<ApiResponse<GoogleCalendarIntegracao[]>> {
    const headers: Record<string, string> = {};
    if (cliente_id) {
      headers['cliente_id'] = cliente_id;
    }

    return this.request<GoogleCalendarIntegracao[]>(
      '/google-calendar/integracoes',
      {
        method: 'GET',
        headers,
      }
    );
  }

  // Criar uma nova Integração
  async criarIntegracao(
    configuracao: CreateGoogleCalendarIntegracao,
    cliente_id?: string
  ): Promise<ApiResponse<GoogleCalendarIntegracao>> {
    const headers: Record<string, string> = {};
    if (cliente_id) {
      headers['cliente_id'] = cliente_id;
    }

    return this.request<GoogleCalendarIntegracao>(
      '/google-calendar/integracoes',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(configuracao),
      },
      { showSuccess: true }
    );
  }

  // Atualizar uma Integração existente
  async atualizarIntegracao(
    id: string,
    configuracao: CreateGoogleCalendarIntegracao,
    cliente_id?: string,
    showSuccess?: boolean
  ): Promise<ApiResponse<GoogleCalendarIntegracao>> {
    const headers: Record<string, string> = {};
    if (cliente_id) {
      headers['cliente_id'] = cliente_id;
    }

    return this.request<GoogleCalendarIntegracao>(
      `/google-calendar/integracoes/${id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(configuracao),
      },
      { showSuccess: showSuccess }
    );
  }

  // Deletar uma Integração
  async deletarIntegracao(id: string, cliente_id?: string): Promise<ApiResponse<void>> {
    const headers: Record<string, string> = {};
    if (cliente_id) {
      headers['cliente_id'] = cliente_id;
    }

    return this.request<void>(
      `/google-calendar/integracoes/${id}`,
      {
        method: 'DELETE',
        headers,
      },
      { showSuccess: true }
    );
  }
}

export const googleCalendarApi = new GoogleCalendarApiService();
export default googleCalendarApi;