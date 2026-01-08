// Serviço para integração com a API de Documentos

import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getValidatedApiUrl } from '../utils/api-config';

export interface Documento {
  id?: string;
  nome: string;
  descricao?: string;
  nome_arquivo: string;
  cliente_id?: string;
  base_id?: string | string[];
  base64?: string;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
  deletado?: boolean;
  similarity?: number;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: PaginationData;
  errors?: any[];
}

export interface ListDocumentosParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BuscarSimilaresParams {
  texto: string;
  limite?: number;
}

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Documentos:', error);
  // Em caso de erro, usar uma URL que causará erro explícito
  API_BASE_URL = '';
}

class DocumentosApiService {
  private getHeaders(clienteId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig,
    clienteId?: string
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

      if (!clienteId) {
        throw new Error('Header cliente_id é obrigatório');
      }

      const fullUrl = `${API_BASE_URL}${endpoint}`;
      
      const finalHeaders = {
        ...this.getHeaders(clienteId),
        ...options.headers,
      };

      const response = await fetch(fullUrl, {
        ...options,
        headers: finalHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar a mensagem padrão
        }

        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage, toastConfig);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (toastConfig?.showSuccess && data.success) {
        ToastInterceptor.handleSuccess(data.message || 'Operação realizada com sucesso!', toastConfig);
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      if (toastConfig?.showError !== false) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        ToastInterceptor.handleError(errorMessage, toastConfig);
      }
      throw error;
    }
  }

  // Listar documentos com paginação e busca
  async getDocumentos(params?: ListDocumentosParams, clienteId?: string): Promise<ApiResponse<{ documentos: Documento[]; pagination: PaginationData }>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/documentos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.request<{ documentos: Documento[]; pagination: PaginationData }>(endpoint, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Buscar documento por ID
  async getDocumentoById(id: string, clienteId?: string): Promise<ApiResponse<Documento>> {
    return this.request<Documento>(`/documentos/${id}`, {
      method: 'GET',
    }, undefined, clienteId);
  }

  // Criar novo documento
  async createDocumento(documento: Omit<Documento, 'id'>, clienteId?: string): Promise<ApiResponse<Documento>> {
    return this.request<Documento>('/documentos', {
      method: 'POST',
      body: JSON.stringify(documento),
    }, {
      showSuccess: true,
      successMessage: 'Documento criado com sucesso!'
    }, clienteId);
  }

  // Atualizar documento
  async updateDocumento(id: string, documento: Partial<Documento>, clienteId?: string): Promise<ApiResponse<Documento>> {
    return this.request<Documento>(`/documentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(documento),
    }, {
      showSuccess: true,
      successMessage: 'Documento atualizado com sucesso!'
    }, clienteId);
  }

  // Excluir documento (soft delete)
  async deleteDocumento(id: string, clienteId?: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/documentos/${id}`, {
      method: 'DELETE',
    }, {
      showSuccess: true,
      successMessage: 'Documento excluído com sucesso!'
    }, clienteId);
  }

  // Buscar documentos similares
  async buscarSimilares(params: BuscarSimilaresParams, clienteId?: string): Promise<ApiResponse<Documento[]>> {
    return this.request<Documento[]>('/documentos/buscar-similares', {
      method: 'POST',
      body: JSON.stringify(params),
    }, undefined, clienteId);
  }
}

export const documentosApi = new DocumentosApiService();
export default documentosApi;
