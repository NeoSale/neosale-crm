import { toast } from 'react-hot-toast';
import { getRuntimeConfig } from '../utils/runtime-config';
import { getValidatedApiUrl } from '@/utils/api-config';

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
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  number?: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  webhook?: {
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    headers?: {
      authorization?: string;
      'Content-Type'?: string;
    };
    events?: string[];
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
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
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
    return this.makeRequest<EvolutionInstance[]>('/evolution-instances/instances');
  }

  // Obter instância específica
  async getInstance(instanceName: string): Promise<ApiResponse<EvolutionInstance>> {
    return this.makeRequest<EvolutionInstance>(`/evolution-instances/instances/${instanceName}`);
  }

  // Criar nova instância
  async createInstance(data: CreateInstanceRequest): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>('/evolution-instances/instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      toast.success('Instância criada com sucesso!');
    }

    return response;
  }

  // Conectar instância e obter QR Code
  async connectInstance(instanceName: string, number?: string): Promise<ApiResponse<QRCodeResponse>> {
    const response = await this.makeRequest<QRCodeResponse>(`/evolution-instances/instances/${instanceName}/connect`, {
      method: 'GET',
    });

    if (response.success) {
      toast.success('Conectando instância...');
    }

    return response;
  }

  // Obter status de conexão
  async getConnectionStatus(instanceName: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/evolution-instances/instances/${instanceName}`);
  }

  // Desconectar instância
  async disconnectInstance(instanceName: string): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>(`/evolution-instances/instances/${instanceName}/disconnect`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Instância desconectada com sucesso!');
    }

    return response;
  }

  // Reiniciar instância
  async restartInstance(instanceName: string): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>(`/evolution-instances/instances/${instanceName}/restart`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Instância reiniciada com sucesso!');
    }

    return response;
  }

  // Atualizar instância
  async updateInstance(
    instanceName: string,
    data: UpdateInstanceRequest
  ): Promise<ApiResponse<EvolutionInstanceData>> {
    const response = await this.makeRequest<EvolutionInstanceData>(`/evolution-instances/instances/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.success) {
      toast.success('Instância atualizada com sucesso!');
    }

    return response;
  }

  // Deletar instância
  async deleteInstance(instanceName: string): Promise<ApiResponse<any>> {
    const response = await this.makeRequest<any>(`/evolution-instances/instances/${instanceName}`, {
      method: 'DELETE',
    });

    if (response.success) {
      toast.success('Instância deletada com sucesso!');
    }

    return response;
  }

  // Obter QR Code para conexão
  async getQRCode(instanceName: string): Promise<ApiResponse<QRCodeResponse>> {
    const response = await this.makeRequest<QRCodeResponse>(`/evolution-instances/instances/${instanceName}/qrcode`, {
      method: 'GET',
    });

    return response;
  }

  // Verificar saúde da API
  async checkApiHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/evolution-instances/health');
  }
}

export const evolutionApi = new EvolutionApiService();