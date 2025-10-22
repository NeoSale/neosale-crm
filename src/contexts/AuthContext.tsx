'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, Usuario } from '../services/authApi';

interface AuthContextData {
  user: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (recurso: string, acao: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = authApi.getCurrentUser();
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await authApi.login(email, senha);

      if (response.success) {
        // Armazenar token e dados do usuário
        localStorage.setItem('token', response.data.sessao.token);
        localStorage.setItem('refresh_token', response.data.sessao.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.usuario));

        setUser(response.data.usuario);
        router.push('/');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const hasPermission = (recurso: string, acao: string): boolean => {
    if (!user) return false;

    return user.perfis.some((perfil) => {
      // Admin tem todas as permissões
      if (perfil.permissoes?.admin === true) return true;

      // Verifica permissão específica
      return perfil.permissoes?.[recurso]?.[acao] === true;
    });
  };

  const isAdmin = (): boolean => {
    if (!user) return false;

    return user.perfis.some((perfil) => perfil.permissoes?.admin === true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
