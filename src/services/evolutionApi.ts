import { toast } from 'react-hot-toast';
import { getRuntimeConfig } from '../utils/runtime-config';
import { getValidatedApiUrl } from '@/utils/api-config';
import { getCurrentClienteId } from '@/utils/cliente-utils';

export interface EvolutionInstanceData {
  instanceName: string;
  instanceId: string;
  owner: string;
  profileName: string;
  profilePictureUrl: string;
  profileStatus: string;
  status: 'open' | 'close' | 'connecting' | 'disconnected';
  serverUrl: string;
  apikey: string;
  integration: {
    integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
    webhook_wa_business: string;
    token: string;
  };
}

export interface EvolutionInstance {
  instance: EvolutionInstanceData;
}

export interface CreateInstanceRequest {
  instance_name: string;
  webhook_url: string;
  webhook_events: string[];
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  qrcode: boolean;
  settings: {
    reject_call: boolean;
    msg_call: string;
    groups_ignore: boolean;
    always_online: boolean;
    read_messages: boolean;
    read_status: boolean;
    sync_full_history: boolean;
  };
}

export interface UpdateInstanceRequest {
  instanceName?: string;
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  webhook?: {
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    events?: string[];
  };
}

export interface QRCodeResponse {
  pairingCode?: string;
  code?: string;
  count?: number;
  qrcode?: string;
  base64?: string;
  qr_code?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
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

class EvolutionApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const cliente_id = getCurrentClienteId();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      
      // Adicionar cliente_id ao header se disponível
      if (cliente_id) {
        headers['cliente_id'] = cliente_id;
      }
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(message);
      return {
        success: false,
        message,
      };
    }
  }

  // Listar instâncias
  async getInstances(): Promise<ApiResponse<EvolutionInstance[]>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    return this.makeRequest<EvolutionInstance[]>(`/evolution-api`);
  }

  // Obter instância específica
  async getInstance(instanceId: string): Promise<ApiResponse<EvolutionInstance>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    return this.makeRequest<EvolutionInstance>(`/evolution-api/${instanceId}`);
  }

  // Criar nova instância
  async createInstance(data: CreateInstanceRequest): Promise<ApiResponse<any>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<any>(`/evolution-api`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      toast.success('Instância criada com sucesso!');
    }

    return response;
  }

  // Conectar instância e obter QR Code
  async connectInstance(instanceId: string, number?: string): Promise<ApiResponse<QRCodeResponse>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<QRCodeResponse>(`/evolution-api/connect/${instanceId}`, {
      method: 'POST',
      body: JSON.stringify({ number }),
    });

    if (response.success) {
      toast.success('Conectando instância...');
    }

    return response;
  }

  // Obter status de conexão
  async getConnectionStatus(instanceId: string): Promise<ApiResponse<any>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    return this.makeRequest<any>(`/evolution-api/${instanceId}`);
  }

  // Desconectar instância
  async disconnectInstance(instanceId: string): Promise<ApiResponse<any>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<any>(`/evolution-api/disconnect/${instanceId}`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Instância desconectada com sucesso!');
    }

    return response;
  }

  // Reiniciar instância
  async restartInstance(instanceId: string): Promise<ApiResponse<any>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<any>(`/evolution-api/restart/${instanceId}`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Instância reiniciada com sucesso!');
    }

    return response;
  }

  // Atualizar instância
  async updateInstance(
    instanceId: string,
    data: UpdateInstanceRequest
  ): Promise<ApiResponse<EvolutionInstanceData>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<EvolutionInstanceData>(`/evolution-api/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.success) {
      toast.success('Instância atualizada com sucesso!');
    }

    return response;
  }

  // Deletar instância
  async deleteInstance(instanceId: string): Promise<ApiResponse<any>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    const response = await this.makeRequest<any>(`/evolution-api/${instanceId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      toast.success('Instância deletada com sucesso!');
    }

    return response;
  }

  // Obter QR Code para conexão
  async getQRCode(instanceName: string): Promise<ApiResponse<QRCodeResponse>> {
    const cliente_id = getCurrentClienteId();
    if (!cliente_id) {
      return {
        success: false,
        message: 'Cliente ID não encontrado. Faça login novamente.',
      };
    }
    
    const endpoint = `/evolution-api/qrcode/${instanceName}`;
    
    const response = await this.makeRequest<QRCodeResponse>(endpoint, {
      method: 'GET',
    });

    return response;
  }

  // Verificar saúde da API
  async checkHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/evolution-api/status');
  }
}

export const evolutionApi = new EvolutionApiService();