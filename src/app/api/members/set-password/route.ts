import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    console.log('=== SET-PASSWORD API CHAMADA ===')
    
    const { password, full_name, user_id } = await request.json()
    
    console.log('Dados recebidos - full_name:', full_name, 'password length:', password?.length, 'user_id:', user_id)

    // Verificar autenticação via Authorization header (Bearer token)
    const authHeader = request.headers.get('Authorization')
    let userId = user_id
    let userEmail = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('Verificando token...')
      
      // Validar token e obter dados do usuário
      const tokenClient = createAdminClient(supabaseUrl, supabaseServiceKey)
      const { data: tokenAuth, error: tokenError } = await tokenClient.auth.getUser(token)
      console.log('Auth via token:', tokenAuth?.user?.email, 'Erro:', tokenError?.message)
      
      if (tokenAuth?.user) {
        // Token válido - usar userId do token se não foi passado
        if (!userId) {
          userId = tokenAuth.user.id
        }
        userEmail = tokenAuth.user.email
      } else if (!user_id) {
        // Token inválido e sem user_id - erro
        console.error('Token inválido e sem user_id')
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
      }
    } else if (!user_id) {
      // Sem token e sem user_id - erro
      console.error('Sem Authorization header e sem user_id')
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
    }
    
    if (!userId) {
      console.error('userId não identificado')
      return NextResponse.json({ error: 'Usuário não identificado' }, { status: 401 })
    }
    
    console.log('Usuário identificado - userId:', userId, 'email:', userEmail)

    // Verificar se service key está configurada
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada!')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Usar admin client para atualizar a senha (mais confiável)
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Atualizando senha para user ID:', userId)

    // Atualizar senha usando admin API
    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { 
        password,
        email_confirm: true, // Garantir que email está confirmado
        user_metadata: {
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
        .eq('id', userId)
    }

    console.log('Senha atualizada com sucesso para userId:', userId)

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
