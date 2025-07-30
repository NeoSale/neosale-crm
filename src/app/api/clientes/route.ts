import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../utils/api-config';

export async function GET(request: NextRequest) {
  try {
    // Validar e obter a URL da API
    let apiUrl;
    try {
      apiUrl = getValidatedApiUrl();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'API não configurada. Verifique a variável NEXT_PUBLIC_API_URL.',
          error: error instanceof Error ? error.message : 'Configuração inválida'
        },
        { status: 500 }
      );
    }

    const fullUrl = `${apiUrl}/clientes/all`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API externa:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: fullUrl
      });
      
      return NextResponse.json(
        {
          success: false,
          message: `Erro na API externa: ${response.status} ${response.statusText}`,
          error: errorText || 'Erro desconhecido'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}