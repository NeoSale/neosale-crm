import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Leads (ID):', error);
  API_BASE_URL = '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar se a API está configurada
    if (!API_BASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.',
          error: 'Configuração inválida'
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const clienteId = request.headers.get('cliente_id');
    
    const fullUrl = `${API_BASE_URL}/leads/${id}`;
    
    // Preparar headers para a requisição externa
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar o cliente_id ao header se estiver presente
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Lead não encontrado'
          },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao buscar lead',
          error: errorData.error || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao buscar lead',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar se a API está configurada
    if (!API_BASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.',
          error: 'Configuração inválida'
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const clienteId = request.headers.get('cliente_id');
    
    const fullUrl = `${API_BASE_URL}/leads/${id}`;
    
    // Preparar headers para a requisição externa
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar o cliente_id ao header se estiver presente
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao atualizar lead',
          error: errorData.error || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao atualizar lead',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar se a API está configurada
    if (!API_BASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.',
          error: 'Configuração inválida'
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const clienteId = request.headers.get('cliente_id');
    
    const fullUrl = `${API_BASE_URL}/leads/${id}`;
    
    // Preparar headers para a requisição externa
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar o cliente_id ao header se estiver presente
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao deletar lead',
          error: errorData.error || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao deletar lead',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}