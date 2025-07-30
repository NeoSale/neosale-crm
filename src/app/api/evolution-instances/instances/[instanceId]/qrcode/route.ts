import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../../../../utils/api-config';

// Validar e obter URL da API de forma segura
let API_BASE_URL: string;
try {
  API_BASE_URL = getValidatedApiUrl();
} catch (error) {
  console.error('Erro na configuração da API de Evolution Instances (QRCode):', error);
  API_BASE_URL = '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
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

    // Obter cliente_id do header
    const cliente_id = request.headers.get('cliente_id');
    
    if (!cliente_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'cliente_id é obrigatório no header',
          error: 'Header cliente_id não encontrado'
        },
        { status: 400 }
      );
    }

    const { instanceId } = await params;
    
    const fullUrl = `${API_BASE_URL}/evolution-api/connect/${instanceId}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cliente_id': cliente_id,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao obter QR Code',
          error: errorData.error || `HTTP error! status: ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao obter QR Code',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}