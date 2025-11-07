/**
 * API Route: Enviar Convite
 * 
 * Usa Supabase Admin API para convidar usuários.
 * Requer service_role key para acessar Admin API.
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

export async function POST(request: NextRequest) {
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

    // Verificar se usuário é admin (você pode adicionar lógica de permissão aqui)
    // const { data: userData } = await supabaseAdmin
    //   .from('usuarios')
    //   .select('perfis(permissoes)')
    //   .eq('auth_user_id', user.id)
    //   .single();

    // Obter dados do convite
    const body = await request.json();
    const { email, nome, perfil_id, cliente_id, revendedor_id, tipo_acesso_id, mensagem_personalizada } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { success: false, message: 'Usuário com este email já existe' },
        { status: 400 }
      );
    }

    // Convidar usuário via Supabase Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nome: nome || '',
        perfil_id: perfil_id || '',
        cliente_id: cliente_id || '',
        revendedor_id: revendedor_id || '',
        tipo_acesso_id: tipo_acesso_id || '',
        mensagem_personalizada: mensagem_personalizada || '',
        convidado_por: user.id,
        convidado_em: new Date().toISOString()
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    });

    if (inviteError) {
      console.error('Erro ao convidar usuário:', inviteError);
      return NextResponse.json(
        { success: false, message: inviteError.message },
        { status: 500 }
      );
    }

    // Salvar convite no banco de dados (opcional, para tracking)
    const { error: dbError } = await supabaseAdmin
      .from('convites')
      .insert({
        email,
        nome,
        perfil_id,
        cliente_id,
        revendedor_id,
        tipo_acesso_id,
        mensagem_personalizada,
        convidado_por: user.id,
        status: 'pendente',
        auth_user_id: inviteData.user.id
      });

    if (dbError) {
      console.error('Erro ao salvar convite no banco:', dbError);
      // Não retornar erro, pois o convite foi enviado com sucesso
    }

    return NextResponse.json({
      success: true,
      message: 'Convite enviado com sucesso!',
      data: {
        email,
        user_id: inviteData.user.id
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar convite:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
