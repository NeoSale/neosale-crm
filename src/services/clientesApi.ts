import { getValidatedApiUrl } from '../utils/api-config';
import { getCurrentClienteId } from '../utils/cliente-utils';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  nome_responsavel_principal?: string;
  cnpj?: string;
  espaco_fisico?: boolean;
  site_oficial?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  redes_sociais?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  horario_funcionamento?: {
    [key: string]: {
      abertura?: string;
      fechamento?: string;
      ativo: boolean;
    };
  };
  regioes_atendidas?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ClientesApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: { showSuccess?: boolean; showError?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${getValidatedApiUrl()}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || `Erro ${response.status}: ${response.statusText}`;
        return {
          success: false,
          message: errorMessage,
          error: data.error || 'Erro na requisição'
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('Erro na requisição:', error);
      return {
        success: false,
        message: 'Erro de conexão com o servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Buscar todos os clientes
  async getClientes(): Promise<ApiResponse<Cliente[]>> {
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    return this.request<Cliente[]>('/clientes/all', requestOptions, {
      showSuccess: false, // Não mostrar toast para busca
      showError: true,
    });
  }

  // Buscar cliente por ID
  async getClienteById(id: string): Promise<ApiResponse<Cliente>> {
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    return this.request<Cliente>(`/clientes/${id}`, requestOptions, {
      showSuccess: false,
      showError: true,
    });
  }

  // Atualizar cliente
  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    // Mapear apenas os campos permitidos
    const camposPermitidos = {
      cep: cliente.cep,
      cidade: cliente.cidade,
      cnpj: cliente.cnpj,
      complemento: cliente.complemento,
      email: cliente.email,
      espaco_fisico: cliente.espaco_fisico,
      estado: cliente.estado,
      horario_funcionamento: cliente.horario_funcionamento,
      logradouro: cliente.logradouro,
      nome: cliente.nome,
      nome_responsavel_principal: cliente.nome_responsavel_principal,
      numero: cliente.numero,
      pais: cliente.pais,
      redes_sociais: cliente.redes_sociais,
      site_oficial: cliente.site_oficial,
      telefone: cliente.telefone
    };

    // Remover campos undefined/null
    const dadosLimpos = Object.fromEntries(
      Object.entries(camposPermitidos).filter(([_, value]) => value !== undefined && value !== null)
    );

    const requestOptions: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosLimpos)
    };
    
    return this.request<Cliente>(`/clientes/${id}`, requestOptions, {
      showSuccess: true,
      showError: true,
    });
  }
}

export const clientesApi = new ClientesApiService();