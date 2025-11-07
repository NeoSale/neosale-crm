/**
 * API Route: Buscar Dados do Usuário Autenticado
 * 
 * Retorna dados completos do usuário incluindo clientes e permissões.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cliente Admin do Supabase (server-side only)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar se token é válido
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar clientes do usuário
    let clientes = [];
    
    if (userData.tipo_usuario === 'super_admin') {
      // Super Admin vê todos os clientes
      const { data: allClientes } = await supabaseAdmin
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      clientes = allClientes || [];
    } else {
      // Usuário normal vê apenas seus clientes
      const { data: userClientes } = await supabaseAdmin
        .from('usuario_clientes')
        .select(`
          cliente_id,
          perfil_id,
          is_principal,
          clientes:cliente_id (
            id,
            nome,
            razao_social,
            cnpj,
            logo_url,
            ativo
          ),
          perfis:perfil_id (
            id,
            nome,
            permissoes
          )
        `)
        .eq('usuario_id', userData.id)
        .eq('ativo', true);

      clientes = (userClientes || []).map((uc: any) => ({
        cliente_id: uc.clientes.id,
        cliente_nome: uc.clientes.nome,
        cliente_razao_social: uc.clientes.razao_social,
        cliente_cnpj: uc.clientes.cnpj,
        cliente_logo_url: uc.clientes.logo_url,
        perfil_id: uc.perfis?.id,
        perfil_nome: uc.perfis?.nome,
        permissoes: uc.perfis?.permissoes || {},
        is_principal: uc.is_principal
      }));
    }

    // Montar resposta
    const response = {
      id: userData.id,
      auth_user_id: userData.auth_user_id,
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone,
      avatar_url: userData.avatar_url,
      tipo_usuario: userData.tipo_usuario,
      ativo: userData.ativo,
      email_verificado: userData.email_verificado,
      ultimo_acesso: userData.ultimo_acesso,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      perfis: clientes.length > 0 ? clientes : [{
        perfil_id: 'super_admin',
        perfil_nome: 'Super Admin',
        permissoes: { admin: true, super_admin: true },
        cliente_id: null
      }]
    };

    // Atualizar último acesso
    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', userData.id);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
