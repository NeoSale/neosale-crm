import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Mensagem {
  id: string;
  nome?: string;
  intervalo_numero: number;
  intervalo_tipo: string;
  enviada: boolean;
  data_hora_envio?: string;
  texto_mensagem: string;
  embedding?: string;
  created_at: string;
  updated_at?: string;
}

export interface MensagemForm {
  nome?: string;
  intervalo_numero: number;
  intervalo_tipo: string;
  texto_mensagem: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class MensagensApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na API: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  // Buscar todas as mensagens
  async getMensagens(): Promise<ApiResponse<Mensagem[]>> {
    return this.request<Mensagem[]>('/mensagens');
  }

  // Buscar mensagem por ID
  async getMensagemById(id: string): Promise<ApiResponse<Mensagem>> {
    return this.request<Mensagem>(`/mensagens/${id}`);
  }

  // Criar nova mensagem
  async createMensagem(mensagem: MensagemForm): Promise<ApiResponse<Mensagem>> {
    const response = await this.request<Mensagem>('/mensagens', {
      method: 'POST',
      body: JSON.stringify(mensagem),
    });

    if (response.success) {
      toast.success('Mensagem criada com sucesso!');
    }

    return response;
  }

  // Atualizar mensagem
  async updateMensagem(id: string, mensagem: Partial<MensagemForm>): Promise<ApiResponse<Mensagem>> {
    const response = await this.request<Mensagem>(`/mensagens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mensagem),
    });

    if (response.success) {
      toast.success('Mensagem atualizada com sucesso!');
    }

    return response;
  }

  // Deletar mensagem
  async deleteMensagem(id: string): Promise<ApiResponse<void>> {
    const response = await this.request<void>(`/mensagens/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      toast.success('Mensagem deletada com sucesso!');
    }

    return response;
  }

  // Buscar mensagens com filtros
  async searchMensagens(params: {
    nome?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ mensagens: Mensagem[]; total: number }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/mensagens/search?${queryString}` : '/mensagens/search';
    
    return this.request<{ mensagens: Mensagem[]; total: number }>(endpoint);
  }



  // Enviar mensagem
  async enviarMensagem(id: string): Promise<ApiResponse<{ enviado: boolean; detalhes: string }>> {
    const response = await this.request<{ enviado: boolean; detalhes: string }>(`/mensagens/${id}/enviar`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Mensagem enviada com sucesso!');
    }

    return response;
  }

  // Duplicar mensagem
  async duplicarMensagem(id: string): Promise<ApiResponse<Mensagem>> {
    const response = await this.request<Mensagem>(`/mensagens/${id}/duplicar`, {
      method: 'POST',
    });

    if (response.success) {
      toast.success('Mensagem duplicada com sucesso!');
    }

    return response;
  }
}

export const mensagensApi = new MensagensApiService();
export default mensagensApi;