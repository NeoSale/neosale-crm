import { NextRequest, NextResponse } from 'next/server';
import { getValidatedApiUrl } from '../../../utils/api-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cliente_id = request.headers.get('cliente_id');

    if (!cliente_id) {
      return NextResponse.json(
        { success: false, message: 'Cliente ID é obrigatório' },
        { status: 400 }
      );
    }

    const apiUrl = getValidatedApiUrl();
    
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cliente_id': cliente_id,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}