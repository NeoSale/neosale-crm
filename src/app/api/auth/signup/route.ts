/**
 * API Route: Signup Manual
 * 
 * Cria usuário no Supabase Auth E na tabela usuarios
 * Solução alternativa caso o trigger não funcione
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
    const body = await request.json();
    const { email, password, nome, tipo_usuario } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome: nome || email.split('@')[0],
        tipo_usuario: tipo_usuario || 'usuario'
      }
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // 2. Criar registro na tabela usuarios
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome: nome || email.split('@')[0],
        email: email,
        tipo_usuario: tipo_usuario || 'usuario',
        ativo: true,
        email_verificado: true
      })
      .select()
      .single();

    if (userError) {
      // Se falhar ao criar em usuarios, deletar do auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { success: false, message: `Erro ao criar usuário: ${userError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: userData.id,
        auth_user_id: userData.auth_user_id,
        email: userData.email,
        nome: userData.nome,
        tipo_usuario: userData.tipo_usuario
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
