import { toast } from 'react-hot-toast';
import { getValidatedApiUrl } from '@/utils/api-config';
import { getCurrentClienteId } from '@/utils/cliente-utils';

export interface EvolutionInstancesV2 {
    instanceName?: string;
    instanceId?: string;
    integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
    qrcode?: boolean;
    owner?: string;
    profileName?: string;
    profilePictureUrl?: string;
    profileStatus?: string;
    status?: 'open' | 'close' | 'connecting' | 'disconnected';
    followup?: boolean;
    qtd_envios_diarios?: number;
    id_agente?: string;
    Setting?: {
        alwaysOnline?: boolean;
        groupsIgnore?: boolean;
        msgCall?: string;
        readMessages?: boolean;
        readStatus?: boolean;
        rejectCall?: boolean;
        syncFullHistory?: boolean;
    };
    agente?: AgenteData;
    createdAt?: string;
}

export interface AgenteData {
    id: string;
    nome: string;
    ativo: boolean;
    agendamento: boolean;
    prompt: string;
    prompt_agendamento: string;
    tipo_agente: {
        nome: string;
    }
}

export interface QRCodeResponse {
    pairingCode?: string;
    code?: string;
    count?: number;
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

class EvolutionApiV2Service {
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
    async getInstances(): Promise<ApiResponse<EvolutionInstancesV2[]>> {
        const cliente_id = getCurrentClienteId();
        if (!cliente_id) {
            return {
                success: false,
                message: 'Cliente ID não encontrado. Faça login novamente.',
            };
        }
        return this.makeRequest<EvolutionInstancesV2[]>(`/evolution-api-v2`);
    }

    // Obter instância específica
    async getInstance(instanceId: string): Promise<ApiResponse<EvolutionInstancesV2>> {
        const cliente_id = getCurrentClienteId();
        if (!cliente_id) {
            return {
                success: false,
                message: 'Cliente ID não encontrado. Faça login novamente.',
            };
        }
        return this.makeRequest<EvolutionInstancesV2>(`/evolution-api-v2/${instanceId}`);
    }

    // Criar nova instância
    async createInstance(data: EvolutionInstancesV2): Promise<ApiResponse<any>> {
        const cliente_id = getCurrentClienteId();
        if (!cliente_id) {
            return {
                success: false,
                message: 'Cliente ID não encontrado. Faça login novamente.',
            };
        }
        const response = await this.makeRequest<any>(`/evolution-api-v2`, {
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
        const response = await this.makeRequest<QRCodeResponse>(`/evolution-api-v2-v2/connect/${instanceId}`, {
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
        return this.makeRequest<any>(`/evolution-api-v2/${instanceId}`);
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
        const response = await this.makeRequest<any>(`/evolution-api-v2/disconnect/${instanceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'cliente_id': cliente_id,
            },
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
        const response = await this.makeRequest<any>(`/evolution-api-v2/restart/${instanceId}`, {
            method: 'PUT',
        });

        if (response.success) {
            toast.success('Instância reiniciada com sucesso!');
        }

        return response;
    }

    // Atualizar instância
    async updateInstance(instanceId?: string, data?: EvolutionInstancesV2): Promise<ApiResponse<EvolutionInstancesV2>> {
        const cliente_id = getCurrentClienteId();
        if (!cliente_id) {
            return {
                success: false,
                message: 'Cliente ID não encontrado. Faça login novamente.',
            };
        }
        const response = await this.makeRequest<EvolutionInstancesV2>(`/evolution-api-v2/${instanceId}`, {
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
        const response = await this.makeRequest<any>(`/evolution-api-v2/${instanceId}`, {
            method: 'DELETE',
        });

        if (response.success) {
            toast.success('Instância deletada com sucesso!');
        }

        return response;
    }

    // Obter QR Code para conexão
    async getQRCode(instanceId: string): Promise<ApiResponse<QRCodeResponse>> {
        const cliente_id = getCurrentClienteId();
        if (!cliente_id) {
            return {
                success: false,
                message: 'Cliente ID não encontrado. Faça login novamente.',
            };
        }

        const endpoint = `/evolution-api-v2/connect/${instanceId}`;

        const response = await this.makeRequest<QRCodeResponse>(endpoint, {
            method: 'GET',
        });

        return response;
    }

    // Verificar saúde da API
    async checkHealth(): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/evolution-api-v2/status');
    }
}

export const evolutionApiV2 = new EvolutionApiV2Service();