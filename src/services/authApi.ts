import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Interfaces
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  token_convite: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  email_verificado: boolean;
  perfis: Perfil[];
  created_at: string;
  updated_at: string;
}

export interface Perfil {
  perfil_id: string;
  perfil_nome: string;
  permissoes: any;
  cliente_id?: string;
}

export interface Sessao {
  token: string;
  refresh_token: string;
  expira_em: string;
  refresh_expira_em: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    sessao: Sessao;
  };
  message: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    sessao: Sessao;
  };
  message: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    expira_em: string;
  };
  message: string;
}

export interface ConviteData {
  id: string;
  email: string;
  nome?: string;
  telefone?: string;
  perfil_id: string;
  cliente_id?: string;
  revendedor_id?: string;
  convidado_por?: string;
  tipo_acesso_id?: string;
  status: string;
  expira_em: string;
  mensagem_personalizada?: string;
}

export interface ValidateInviteResponse {
  success: boolean;
  data: ConviteData;
  message: string;
}

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  perfil_id: string;
  cliente_id?: string;
  revendedor_id?: string;
  tipo_acesso_id?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    ativo: boolean;
  };
  message: string;
}

export interface AcceptInviteRequest {
  usuario_criado_id: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    status: string;
    aceito_em: string;
    usuario_criado_id: string;
  };
  message: string;
}

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para renovar token automaticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.success) {
            localStorage.setItem('token', response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Se falhar ao renovar, fazer logout
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  /**
   * Fazer login com email e senha
   */
  login: async (email: string, senha: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      senha,
    });
    return response.data;
  },

  /**
   * Registrar novo usuário via convite
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Fazer logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Renovar token de acesso
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Solicitar reset de senha
   */
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Resetar senha com token
   */
  resetPassword: async (
    token: string,
    novaSenha: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', {
      token,
      nova_senha: novaSenha,
    });
    return response.data;
  },

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  /**
   * Obter usuário atual do localStorage
   */
  getCurrentUser: (): Usuario | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Verificar se usuário tem permissão específica
   */
  hasPermission: (recurso: string, acao: string): boolean => {
    const user = authApi.getCurrentUser();
    if (!user) return false;

    return user.perfis.some((perfil) => {
      // Admin tem todas as permissões
      if (perfil.permissoes?.admin === true) return true;

      // Verifica permissão específica
      return perfil.permissoes?.[recurso]?.[acao] === true;
    });
  },

  /**
   * Verificar se usuário é admin
   */
  isAdmin: (): boolean => {
    const user = authApi.getCurrentUser();
    if (!user) return false;

    return user.perfis.some((perfil) => perfil.permissoes?.admin === true);
  },

  /**
   * Validar token de convite
   */
  validateInvite: async (token: string): Promise<ValidateInviteResponse> => {
    const response = await api.get<ValidateInviteResponse>(`/convites/token/${token}`);
    return response.data;
  },

  /**
   * Criar novo usuário
   */
  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post<CreateUserResponse>('/usuarios', data);
    return response.data;
  },

  /**
   * Aceitar convite
   */
  acceptInvite: async (conviteId: string, data: AcceptInviteRequest): Promise<AcceptInviteResponse> => {
    const response = await api.post<AcceptInviteResponse>(`/convites/${conviteId}/aceitar`, data);
    return response.data;
  },
};

export default api;
