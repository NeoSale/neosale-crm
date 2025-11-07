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

// Fila para controlar múltiplas requisições durante refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para renovar token automaticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignorar erros que não são 401 ou requisições de login/refresh
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Ignorar se for requisição de login ou refresh
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Se já tentou fazer refresh, redirecionar para login
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se já está fazendo refresh, adicionar à fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      processQueue(new Error('No refresh token'), null);
      isRefreshing = false;
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const response = await authApi.refreshToken(refreshToken);
      
      if (response.success && response.data.token) {
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        isRefreshing = false;
        return api(originalRequest);
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
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
    if (!token) return false;

    try {
      // Decodificar JWT para verificar expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Verificar se token expirou
      if (payload.exp && payload.exp < now) {
        // Token expirado, limpar
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      // Token inválido
      console.error('Token inválido:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return false;
    }
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
