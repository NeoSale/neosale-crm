import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const clienteId = request.headers.get('cliente_id')
    
    if (!clienteId) {
      return NextResponse.json(
        { error: 'cliente_id é obrigatório' },
        { status: 400 }
      )
    }

    // Usar service role para bypassar RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar profiles:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Erro no endpoint /api/profiles:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profileId = request.headers.get('x-profile-id')
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id é obrigatório' },
        { status: 400 }
      )
    }

    // Usar service role para bypassar RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Remove o cliente_id do profile (desvincula do cliente)
    const { error } = await supabase
      .from('profiles')
      .update({ cliente_id: null })
      .eq('id', profileId)

    if (error) {
      console.error('Erro ao desvincular profile:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no endpoint DELETE /api/profiles:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
