/**
 * Serviço de Convites com Supabase
 * 
 * Gerencia envio e aceitação de convites de usuários usando Supabase Auth.
 */

import { supabase } from '../lib/supabase';

export interface InviteUserData {
  email: string;
  nome?: string;
  perfil_id?: string;
  cliente_id?: string;
  revendedor_id?: string;
  tipo_acesso_id?: string;
  mensagem_personalizada?: string;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const inviteService = {
  /**
   * Convidar usuário via Supabase Auth
   * 
   * O Supabase enviará automaticamente um email com link de confirmação.
   * O usuário será redirecionado para /auth/callback onde poderá definir a senha.
   */
  inviteUser: async (inviteData: InviteUserData): Promise<InviteResponse> => {
    try {
      // Verificar se usuário atual tem permissão (admin)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Você precisa estar autenticado para enviar convites'
        };
      }

      // Convidar usuário via Supabase Admin API
      // Nota: Isso requer uma função Edge ou API Route com service_role key
      const response = await fetch('/api/invite/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(inviteData)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Erro ao enviar convite'
        };
      }

      return {
        success: true,
        message: 'Convite enviado com sucesso!',
        data: result.data
      };
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar convite'
      };
    }
  },

  /**
   * Listar convites pendentes
   */
  listPendingInvites: async (): Promise<InviteResponse> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Você precisa estar autenticado'
        };
      }

      const response = await fetch('/api/invite/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Erro ao listar convites'
        };
      }

      return {
        success: true,
        message: 'Convites carregados',
        data: result.data
      };
    } catch (error: any) {
      console.error('Erro ao listar convites:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar convites'
      };
    }
  },

  /**
   * Cancelar convite
   */
  cancelInvite: async (inviteId: string): Promise<InviteResponse> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Você precisa estar autenticado'
        };
      }

      const response = await fetch(`/api/invite/${inviteId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Erro ao cancelar convite'
        };
      }

      return {
        success: true,
        message: 'Convite cancelado com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao cancelar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao cancelar convite'
      };
    }
  },

  /**
   * Reenviar convite
   */
  resendInvite: async (email: string): Promise<InviteResponse> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Você precisa estar autenticado'
        };
      }

      const response = await fetch('/api/invite/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Erro ao reenviar convite'
        };
      }

      return {
        success: true,
        message: 'Convite reenviado com sucesso!'
      };
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reenviar convite'
      };
    }
  }
};
