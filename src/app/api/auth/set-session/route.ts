import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()
    
    if (!access_token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Setar sessão - isso vai configurar os cookies corretamente
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    })
    
    if (error) {
      console.error('Erro ao setar sessão:', error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: data.user 
    })
  } catch (error: any) {
    console.error('Erro no set-session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
