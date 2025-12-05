import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('Deletando usuário do Supabase Auth:', userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('Erro ao deletar usuário do Auth:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Usuário deletado do Supabase Auth com sucesso')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no endpoint /api/members/delete-auth:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
