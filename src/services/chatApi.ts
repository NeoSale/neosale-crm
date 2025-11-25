import { getValidatedApiUrl } from '../utils/api-config';

let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Chat:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

export interface Chat {
  id: string;
  nome: string;
  telefone: string;
  profile_picture_url?: string;
  ultima_mensagem: string;
  data_ultima_mensagem: string;
}

export interface ChatMessage {
  id: string;
  lead_id: string;
  mensagem: string;
  status: string;
  tipo: 'human' | 'ai';
  source: string;
  created_at: string;
  erro?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data: Chat[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ChatMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SendMessageRequest {
  lead_id: string;
  mensagem: string;
  tipo: 'ai' | 'human';
  source: string;
}

class ChatApi {
  private getHeaders(clienteId: string) {
    return {
      'Content-Type': 'application/json',
      'cliente_id': clienteId,
    };
  }

  async getChats(clienteId: string): Promise<ChatResponse> {
    // Validar se cliente_id está presente
    if (!clienteId) {
      throw new Error('cliente_id é obrigatório');
    }

    const headers = this.getHeaders(clienteId);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API de chat:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: headers
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getMessages(id: string, clienteId: string, page: number = 1, limit: number = 50): Promise<ChatMessagesResponse> {
    if (!clienteId) {
      throw new Error('cliente_id é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/chat/lead/${id}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(clienteId),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(data: SendMessageRequest, clienteId: string): Promise<any> {
    if (!clienteId) {
      throw new Error('cliente_id é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/chat/sendText`, {
      method: 'POST',
      headers: this.getHeaders(clienteId),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const chatApi = new ChatApi();