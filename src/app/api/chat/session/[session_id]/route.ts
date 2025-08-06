import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../../../utils/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const cliente_id = request.headers.get('cliente_id');
    const resolvedParams = await params;

    if (!cliente_id) {
      return NextResponse.json(
        { error: 'cliente_id é obrigatório no cabeçalho' },
        { status: 400 }
      );
    }

    const apiUrl = getValidatedApiUrl();
    
    const response = await fetch(`${apiUrl}/chat/session/${resolvedParams.session_id}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'cliente_id': cliente_id,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar mensagens da sessão:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}