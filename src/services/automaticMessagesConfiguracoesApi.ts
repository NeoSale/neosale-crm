// Serviço para integração com a API de Configurações de Automatic Messages

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';
import { getClienteId } from '../utils/cliente-utils';

export interface AutomaticMessagesConfiguracao {
  id?: string;
  chave: string;
  valor: string;
  apikeyopenai?: string;
  promptsdr?: string;
  horario_inicio?: string;
  horario_fim?: string;
  qtd_envio_diario?: string;
  somente_dias_uteis?: string;
}

export interface AutomaticMessagesConfiguracaoForm {
  [key: string]: string | boolean;
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
  console.error('Erro na configuração da API de Configurações Automatic Messages:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class AutomaticMessagesConfiguracoesApiService {
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
      
      const clienteId = getClienteId();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      if (clienteId) {
        headers['cliente_id'] = clienteId;
      }
      
      const response = await fetch(fullUrl, {
        headers,
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

  // Buscar todas as configurações
  async getConfiguracoes(): Promise<ApiResponse<AutomaticMessagesConfiguracao[]>> {
    return this.request<AutomaticMessagesConfiguracao[]>('/automatic-messages/configuracao', {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Buscar configuração por ID
  async getConfiguracaoById(id: string): Promise<ApiResponse<AutomaticMessagesConfiguracao>> {
    return this.request<AutomaticMessagesConfiguracao>(`/automatic-messages/configuracao/${id}`, {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Buscar configuração por chave
  async getConfiguracaoByChave(chave: string): Promise<ApiResponse<AutomaticMessagesConfiguracao>> {
    return this.request<AutomaticMessagesConfiguracao>(`/automatic-messages/configuracao/chave/${chave}`, {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Criar nova configuração
  async createConfiguracao(configuracao: Omit<AutomaticMessagesConfiguracao, 'id'>): Promise<ApiResponse<AutomaticMessagesConfiguracao>> {
    return this.request<AutomaticMessagesConfiguracao>('/automatic-messages/configuracao', {
      method: 'POST',
      body: JSON.stringify(configuracao),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Configuração criada com sucesso!',
    });
  }

  // Atualizar configuração
  async updateConfiguracao(id: string, configuracao: Partial<AutomaticMessagesConfiguracao>): Promise<ApiResponse<AutomaticMessagesConfiguracao>> {
    return this.request<AutomaticMessagesConfiguracao>(`/automatic-messages/configuracao/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configuracao),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Configuração atualizada com sucesso!',
    });
  }

  // Deletar configuração
  async deleteConfiguracao(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/automatic-messages/configuracao/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Configuração excluída com sucesso!',
    });
  }

  // Salvar ou atualizar configuração por chave
  async saveConfiguracao(chave: string, valor: string): Promise<ApiResponse<AutomaticMessagesConfiguracao>> {
    try {
      // Primeiro, tentar buscar a configuração existente
      const getResponse = await this.getConfiguracaoByChave(chave);
      
      if (getResponse.success && getResponse.data) {
        // Configuração existe, fazer update
        return await this.updateConfiguracao(getResponse.data.id!, { valor });
      } else {
        // Configuração não existe, criar nova
        return await this.createConfiguracao({ chave, valor });
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return {
        data: null as any,
        message: 'Erro ao salvar configuração',
        success: false,
      };
    }
  }

  // Atualizar limite diário
  async updateLimiteDiario(limite: number): Promise<ApiResponse<any>> {
    return this.request<any>('/automatic-messages/controle-envios/limite-diario', {
      method: 'PUT',
      body: JSON.stringify({ limite }),
    }, {
      showSuccess: false,
      showError: false, // Não mostrar erro pois é opcional
    });
  }

  // Salvar múltiplas configurações
  async saveMultipleConfiguracoes(configuracoes: AutomaticMessagesConfiguracaoForm): Promise<boolean> {
    try {
      const savePromises = Object.keys(configuracoes).map(chave => {
        const valor = configuracoes[chave];
        return this.saveConfiguracao(chave, typeof valor === 'boolean' ? valor.toString() : valor as string);
      });
      
      const results = await Promise.all(savePromises);
      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {
        // Atualizar limite diário se a quantidade foi alterada
        if (configuracoes.quantidade_diaria_maxima) {
          await this.updateLimiteDiario(parseInt(configuracoes.quantidade_diaria_maxima as string));
        }
        
        ToastInterceptor.handleSuccess('Configurações salvas com sucesso!');
        return true;
      } else {
        ToastInterceptor.handleError('Erro ao salvar algumas configurações');
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      ToastInterceptor.handleError('Erro ao salvar configurações');
      return false;
    }
  }
}

export const automaticMessagesConfiguracoesApi = new AutomaticMessagesConfiguracoesApiService();
export default automaticMessagesConfiguracoesApi;
