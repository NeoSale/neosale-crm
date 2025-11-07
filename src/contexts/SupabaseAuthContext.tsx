'use client';

/**
 * Context de Autenticação com Supabase
 * 
 * Gerencia autenticação usando Supabase Auth.
 * Substitui o AuthContext.tsx anterior.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface UserData {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  email_verificado: boolean;
  cliente_id?: string;
  revendedor_id?: string;
  tipo_acesso_id?: string;
  perfis: Array<{
    perfil_id: string;
    perfil_nome: string;
    permissoes: any;
    cliente_id?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface AuthContextData {
  user: UserData | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nome: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  hasPermission: (recurso: string, acao: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Buscar dados completos do usuário da API
  const fetchUserData = async (authUser: User, accessToken: string): Promise<UserData | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Carregar sessão ao iniciar
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserData(session.user, session.access_token).then((userData) => {
          setUser(userData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        const userData = await fetchUserData(session.user, session.access_token);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        const userData = await fetchUserData(data.user, data.session.access_token);
        setUser(userData);
        setSession(data.session);
        router.push('/');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const signup = async (email: string, password: string, nome: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
          },
        },
      });

      if (error) throw error;

      // Usuário criado, aguardar confirmação de email
      if (data.user && !data.session) {
        throw new Error('Verifique seu email para confirmar o cadastro');
      }

      if (data.session) {
        const userData = await fetchUserData(data.user!, data.session.access_token);
        setUser(userData);
        setSession(data.session);
        router.push('/');
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      throw new Error(error.message || 'Erro ao criar conta');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao solicitar reset de senha:', error);
      throw new Error(error.message || 'Erro ao solicitar reset de senha');
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      throw new Error(error.message || 'Erro ao atualizar senha');
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
        session,
        loading,
        isAuthenticated: !!session && !!user,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
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
    throw new Error('useAuth deve ser usado dentro de um SupabaseAuthProvider');
  }

  return context;
}
