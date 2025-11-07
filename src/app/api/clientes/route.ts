/**
 * API Route: Gerenciar Clientes
 * 
 * GET: Listar clientes
 * POST: Criar novo cliente
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

    // Buscar tipo de usuário
    const { data: userData } = await supabaseAdmin
      .from('usuarios')
      .select('id, tipo_usuario')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar clientes
    let query = supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    // Se não for super admin, filtrar apenas clientes do usuário
    if (userData.tipo_usuario !== 'super_admin') {
      const { data: userClientes } = await supabaseAdmin
        .from('usuario_clientes')
        .select('cliente_id')
        .eq('usuario_id', userData.id)
        .eq('ativo', true);

      const clienteIds = (userClientes || []).map((uc: any) => uc.cliente_id);
      query = query.in('id', clienteIds);
    }

    const { data: clientes, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: clientes
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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

    // Buscar tipo de usuário
    const { data: userData } = await supabaseAdmin
      .from('usuarios')
      .select('tipo_usuario')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData || userData.tipo_usuario !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Apenas Super Admin pode criar clientes' },
        { status: 403 }
      );
    }

    // Obter dados do cliente
    const body = await request.json();
    const { nome, razao_social, cnpj, email, telefone, endereco, logo_url, configuracoes } = body;

    if (!nome) {
      return NextResponse.json(
        { success: false, message: 'Nome do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Criar cliente
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .insert({
        nome,
        razao_social,
        cnpj,
        email,
        telefone,
        endereco,
        logo_url,
        configuracoes: configuracoes || {},
        ativo: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: cliente
    });

  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}