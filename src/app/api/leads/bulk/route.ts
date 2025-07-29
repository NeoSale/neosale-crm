import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Leads (Bulk):', error);
  API_BASE_URL = '';
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const clienteId = request.headers.get('cliente_id');
    
    const fullUrl = `${API_BASE_URL}/leads/bulk`;
    
    // Preparar headers para a requisição externa
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar o cliente_id ao header se estiver presente
    if (clienteId) {
      headers['cliente_id'] = clienteId;
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao importar leads',
          error: errorData.error || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro ao importar leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao importar leads',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}