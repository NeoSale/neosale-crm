import { getClienteId } from '../utils/cliente-utils';
import { getValidatedApiUrl } from '../utils/api-config';

let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Chat:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

export interface ChatCliente {
  id: string;
  session_id: string;
  nome: string;
  telefone?: string;
  profile_picture_url?: string;
  ultima_mensagem: {
    type: 'human' | 'ai';
    content: string;
    additional_kwargs: any;
    response_metadata: any;
  };
  data_ultima_mensagem: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai';
    content: string;
    tool_calls: any[];
    additional_kwargs: any;
    response_metadata: any;
    invalid_tool_calls: any[];
  };
  created_at: string;
  updated_at: string;
}

export interface ChatClientesResponse {
  success: boolean;
  message: string;
  data: ChatCliente[];
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
  session_id: string;
  message: {
    type: 'ai';
    content: string;
    tool_calls: any[];
    additional_kwargs: any;
    response_metadata: any;
    invalid_tool_calls: any[];
  };
}

class ChatApi {
  private getHeaders() {
    const clienteId = getClienteId();
    return {
      'Content-Type': 'application/json',
      'cliente_id': clienteId || '',
    };
  }

  async getClientes(page: number = 1, limit: number = 10): Promise<ChatClientesResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/cliente?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getMessages(sessionId: string, page: number = 1, limit: number = 50): Promise<ChatMessagesResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/session/${sessionId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(data: SendMessageRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const chatApi = new ChatApi();