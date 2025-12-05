import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params
    const body = await request.json()
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', profileId)

    if (error) {
      console.error('Erro ao atualizar profile:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no endpoint PATCH /api/profiles/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params
    console.log('Deletando profile com id:', profileId)
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id é obrigatório' },
        { status: 400 }
      )
    }

    // Usar service role para bypassar RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // PRIMEIRO: Deletar o usuário do Supabase Auth (antes de deletar o profile)
    console.log('Deletando usuário do Auth com id:', profileId)
    const { error: authError } = await supabase.auth.admin.deleteUser(profileId)

    if (authError) {
      console.error('Erro ao deletar usuário do Auth:', authError)
      // Continua mesmo com erro, pois o usuário pode não existir no Auth
    } else {
      console.log('Usuário deletado do Auth com sucesso')
    }

    // DEPOIS: Deletar o profile da tabela profiles
    console.log('Deletando profile da tabela profiles')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (profileError) {
      console.error('Erro ao deletar profile:', profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    console.log('Profile deletado com sucesso')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no endpoint DELETE /api/profiles/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
