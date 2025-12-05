import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    console.log('=== SET-PASSWORD API CHAMADA ===')
    
    const supabase = await createClient()
    const { password, full_name } = await request.json()
    
    console.log('Dados recebidos - full_name:', full_name, 'password length:', password?.length)

    // Verificar se usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Usuário autenticado:', user?.email, 'Erro auth:', authError?.message)
    
    if (authError || !user) {
      console.error('Usuário não autenticado')
      return NextResponse.json({ error: 'Unauthorized - ' + (authError?.message || 'No user') }, { status: 401 })
    }

    // Verificar se service key está configurada
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada!')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Usar admin client para atualizar a senha (mais confiável)
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Atualizando senha para user ID:', user.id)

    // Atualizar senha usando admin API
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { 
        password,
        email_confirm: true, // Garantir que email está confirmado
        user_metadata: {
          ...user.user_metadata,
          full_name,
          password_set: true,
          needs_password: false,
        },
      }
    )

    console.log('Resultado updateUserById:', updatedUser?.user?.email, 'Erro:', updateError?.message)

    if (updateError) {
      console.error('Erro ao atualizar senha via admin:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Verificar se a senha foi realmente atualizada
    console.log('Usuário atualizado - identities:', updatedUser?.user?.identities?.length)

    // Atualizar nome no profile
    if (full_name) {
      await adminClient
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id)
    }

    console.log('Senha atualizada com sucesso para:', user.email)

    return NextResponse.json({ 
      success: true, 
      message: 'Senha definida com sucesso!',
      user: updatedUser.user
    })
  } catch (error: any) {
    console.error('Erro ao definir senha:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao definir senha' },
      { status: 500 }
    )
  }
}
