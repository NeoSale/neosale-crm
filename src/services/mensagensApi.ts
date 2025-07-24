import { toast } from 'react-hot-toast';
import { getValidatedApiUrl } from '../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Mensagens:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

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
  ordem?: number; // Campo para ordenação drag and drop
  ativo: boolean; // Flag para controlar se a mensagem está ativa
}

export interface MensagemForm {
  nome?: string;
  intervalo_numero: number;
  intervalo_tipo: string;
  texto_mensagem: string;
  ordem?: number; // Campo para ordenação
  ativo?: boolean; // Flag para controlar se a mensagem está ativa
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
      // Validar se a API está configurada antes de fazer a requisição
      if (!API_BASE_URL) {
        const errorMessage = 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.';
        console.error(errorMessage);
        toast.error(errorMessage);
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

  // Atualizar ordem das mensagens (drag and drop)
  // Referência: http://localhost:3000/api-docs/#/ - endpoint PUT /mensagens/{id}
  async reorderMensagens(mensagensOrdenadas: { id: string; ordem: number }[]): Promise<ApiResponse<any>> {
    try {
      // Atualizar cada mensagem individualmente usando PUT /mensagens/{id}
      const updatePromises = mensagensOrdenadas.map(mensagem => 
        this.request<Mensagem>(`/mensagens/${mensagem.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ordem: mensagem.ordem }),
        })
      );

      const responses = await Promise.all(updatePromises);
      
      // Verificar se todas as atualizações foram bem-sucedidas
      const allSuccessful = responses.every(response => response.success);
      
      if (allSuccessful) {
        toast.success('Ordem das mensagens atualizada com sucesso!');
        return { success: true, data: responses };
      } else {
        toast.error('Erro ao atualizar algumas mensagens');
        return { success: false, error: 'Erro parcial ao reordenar mensagens' };
      }
    } catch (error) {
      console.error('Erro ao reordenar mensagens:', error);
      toast.error('Erro ao atualizar ordem das mensagens');
      return { success: false, error: 'Erro ao reordenar mensagens' };
    }
  }
}

export const mensagensApi = new MensagensApiService();
export default mensagensApi;