// Serviço para integração com a API de Profiles

import { Profile, UserRole } from '@/types/auth';
import ToastInterceptor, { ToastConfig } from './toastInterceptor';
import { getClienteId } from '../utils/cliente-utils';

// Usar path relativo para endpoints internos do Next.js (evita CORS)
const API_BASE_URL = '/api';

// Interface para resposta da API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ProfilesApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    toastConfig?: ToastConfig,
    requireClienteId: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const clienteId = getClienteId();
      if (requireClienteId && !clienteId) {
        const errorMessage = 'Cliente ID não encontrado. Verifique a configuração.';
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const url = `${API_BASE_URL}${endpoint}`;
      
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (clienteId) {
        defaultHeaders['x-cliente-id'] = clienteId;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Erro na requisição: ${response.status} - ${errorText}`;
        console.error(errorMessage);
        if (toastConfig?.showError !== false) {
          ToastInterceptor.handleError(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Verificar se a resposta tem a estrutura esperada
      if (data && typeof data === 'object') {
        // Se já tem estrutura ApiResponse, retornar diretamente
        if ('success' in data) {
          return data as ApiResponse<T>;
        }
        // Se não tem, envolver em uma resposta padrão
        return {
          success: true,
          data: data as T,
        };
      }

      return {
        success: true,
        data: data as T,
      };

    } catch (error) {
      console.error('Erro na requisição:', error);
      if (toastConfig?.showError !== false) {
        ToastInterceptor.handleError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
      throw error;
    }
  }

  /**
   * Busca todos os profiles de um cliente
   * @param clienteId - ID do cliente (opcional, usa o do contexto se não fornecido)
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com a lista de profiles
   */
  async getProfiles(clienteId?: string, toastConfig?: ToastConfig): Promise<Profile[]> {
    const headers: Record<string, string> = {};
    if (clienteId) {
      headers['x-cliente-id'] = clienteId;
    }

    const response = await this.request<Profile[]>('/profiles', {
      method: 'GET',
      headers,
    }, toastConfig);

    return response.data || [];
  }

  /**
   * Busca um profile por ID
   * @param profileId - ID do profile
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o profile encontrado
   */
  async getProfileById(profileId: string, toastConfig?: ToastConfig): Promise<ApiResponse<Profile>> {
    if (!profileId) {
      throw new Error('profile_id é obrigatório');
    }

    return this.request<Profile>(`/profiles/${profileId}`, {
      method: 'GET',
    }, toastConfig, false);
  }

  /**
   * Atualiza um profile
   * @param profileId - ID do profile a ser atualizado
   * @param data - Dados do profile a serem atualizados
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async updateProfile(profileId: string, data: Partial<Profile>, toastConfig?: ToastConfig): Promise<ApiResponse<{ success: boolean }>> {
    if (!profileId) {
      throw new Error('profile_id é obrigatório');
    }

    return this.request<{ success: boolean }>(`/profiles/${profileId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, toastConfig, false);
  }

  /**
   * Atualiza o role de um profile
   * @param profileId - ID do profile
   * @param role - Novo role
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async updateRole(profileId: string, role: UserRole, toastConfig?: ToastConfig): Promise<ApiResponse<{ success: boolean }>> {
    return this.updateProfile(profileId, { role }, toastConfig);
  }

  /**
   * Remove um profile (desvincula do cliente)
   * @param profileId - ID do profile a ser removido
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async deleteProfile(profileId: string, toastConfig?: ToastConfig): Promise<ApiResponse<{ success: boolean }>> {
    if (!profileId) {
      throw new Error('profile_id é obrigatório');
    }

    // Deletar usuário do Supabase Auth
    return this.request<{ success: boolean }>('/members/delete-auth', {
      method: 'POST',
      body: JSON.stringify({ userId: profileId }),
    }, toastConfig, false);
  }

  /**
   * Convida um novo membro
   * @param email - Email do membro a ser convidado
   * @param role - Role do novo membro
   * @param clienteId - ID do cliente (opcional, usa o do contexto se não fornecido)
   * @param fullName - Nome completo do membro (opcional)
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async inviteMember(
    email: string, 
    role: UserRole, 
    clienteId?: string, 
    fullName?: string,
    toastConfig?: ToastConfig
  ): Promise<ApiResponse<{ success: boolean; user?: any; message?: string }>> {
    const cId = clienteId || getClienteId();
    if (!cId) {
      throw new Error('cliente_id é obrigatório');
    }

    return this.request<{ success: boolean; user?: any; message?: string }>('/members/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role, cliente_id: cId, full_name: fullName }),
    }, toastConfig, false);
  }

  /**
   * Reenvia convite para um membro
   * @param email - Email do membro
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async resendInvite(email: string, toastConfig?: ToastConfig): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/members/resend-invite', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, toastConfig, false);
  }

  /**
   * Reseta a senha de um membro
   * @param email - Email do membro
   * @param toastConfig - Configuração para exibição de toasts
   * @returns Promise com o resultado da operação
   */
  async resetPassword(email: string, toastConfig?: ToastConfig): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/members/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, toastConfig, false);
  }
}

export const profilesApi = new ProfilesApiService();
export default profilesApi;
