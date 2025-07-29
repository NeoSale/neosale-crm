import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../../../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Configurações (chave):', error);
  API_BASE_URL = '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chave: string }> }
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

    const { chave } = await params;
    const clienteId = request.headers.get('cliente_id');
    
    const fullUrl = `${API_BASE_URL}/configuracoes/chave/${chave}`;
    
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
            message: 'Configuração não encontrada'
          },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar configuração por chave:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao buscar configuração',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}