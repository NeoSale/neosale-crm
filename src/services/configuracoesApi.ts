// Serviço para integração com a API de Configurações

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';

export interface Configuracao {
  id?: string;
  chave: string;
  valor: string;
  descricao?: string;
  tipo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConfiguracaoForm {
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
  console.error('Erro na configuração da API de Configurações:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class ConfiguracoesApiService {
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
      console.log(`🌐 Fazendo requisição para: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
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

  // Buscar todas as configurações
  async getConfiguracoes(): Promise<ApiResponse<Configuracao[]>> {
    return this.request<Configuracao[]>('/configuracoes', {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Buscar configuração por ID
  async getConfiguracaoById(id: string): Promise<ApiResponse<Configuracao>> {
    return this.request<Configuracao>(`/configuracoes/${id}`, {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Buscar configuração por chave
  async getConfiguracaoByChave(chave: string): Promise<ApiResponse<Configuracao>> {
    return this.request<Configuracao>(`/configuracoes/chave/${chave}`, {}, {
      showSuccess: false,
      showError: true,
    });
  }

  // Criar nova configuração
  async createConfiguracao(configuracao: Omit<Configuracao, 'id'>): Promise<ApiResponse<Configuracao>> {
    return this.request<Configuracao>('/configuracoes', {
      method: 'POST',
      body: JSON.stringify(configuracao),
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Configuração criada com sucesso!',
    });
  }

  // Atualizar configuração
  async updateConfiguracao(id: string, configuracao: Partial<Configuracao>): Promise<ApiResponse<Configuracao>> {
    return this.request<Configuracao>(`/configuracoes/${id}`, {
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
    return this.request<void>(`/configuracoes/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      showError: true,
      successMessage: 'Configuração excluída com sucesso!',
    });
  }

  // Salvar ou atualizar configuração por chave
  async saveConfiguracao(chave: string, valor: string): Promise<ApiResponse<Configuracao>> {
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
    return this.request<any>('/controle-envios/limite-diario', {
      method: 'PUT',
      body: JSON.stringify({ limite }),
    }, {
      showSuccess: false,
      showError: false, // Não mostrar erro pois é opcional
    });
  }

  // Salvar múltiplas configurações
  async saveMultipleConfiguracoes(configuracoes: ConfiguracaoForm): Promise<boolean> {
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

export const configuracoesApi = new ConfiguracoesApiService();
export default configuracoesApi;