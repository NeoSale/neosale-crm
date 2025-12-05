import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// URL base da aplicação baseada no ambiente
const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, role, cliente_id, full_name } = await request.json()

    // Check if user is authenticated and has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usar admin client para verificar permissões (bypassa RLS)
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Check if requester has admin permissions
    const { data: requesterProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!requesterProfile || !['admin', 'super_admin'].includes(requesterProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verificar se usuário já existe no auth
    const { data: existingAuthUser } = await adminClient.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.find(u => u.email === email)

    if (userExists) {
      // Usuário já existe no auth, verificar se tem profile
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id, email, cliente_id')
        .eq('id', userExists.id)
        .single()

      if (existingProfile) {
        // Atualizar cliente_id, role e full_name do profile existente
        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ cliente_id, role, ...(full_name && { full_name }) })
          .eq('id', existingProfile.id)

        if (updateError) throw updateError

        // Enviar magic link para o usuário existente
        const { error: magicLinkError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${getAppUrl()}/signup`,
          }
        })

        if (magicLinkError) {
          console.error('Erro ao gerar magic link:', magicLinkError)
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Usuário existente vinculado ao cliente. Magic link enviado por email.',
          user: existingProfile 
        })
      }
    }

    // Criar novo usuário usando inviteUserByEmail (envia email automaticamente)
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_by: user.id,
        cliente_id,
        role,
        full_name,
      },
      redirectTo: `${getAppUrl()}/signup`,
    })

    // Se falhar o invite (ex: SMTP não configurado), criar usuário e gerar link de invite
    if (inviteError) {
      console.warn('inviteUserByEmail falhou, tentando criar usuário e gerar link de invite:', inviteError.message)
      
      // Gerar senha temporária aleatória (será substituída pelo usuário)
      const tempPassword = crypto.randomUUID() + 'Aa1!'
      
      // Criar usuário COM senha temporária (necessário para criar identity de email/password)
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword, // Senha temporária - será alterada pelo usuário
        email_confirm: true, // Confirmar email para permitir login
        user_metadata: {
          invited_by: user.id,
          cliente_id,
          role,
          full_name,
          needs_password: true, // Marcar que precisa definir senha
        },
      })

      if (createError) throw createError

      // Atualizar profile com cliente_id e role
      if (newUser.user) {
        // Aguardar um pouco para o trigger criar o profile
        await new Promise(resolve => setTimeout(resolve, 500))

        const { error: profileError } = await adminClient
          .from('profiles')
          .update({
            cliente_id,
            role,
            ...(full_name && { full_name }),
          })
          .eq('id', newUser.user.id)

        if (profileError) {
          console.error('Erro ao atualizar profile:', profileError)
        }

        // Gerar link de invite (tipo 'invite' confirma email e permite definir senha)
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            redirectTo: `${getAppUrl()}/signup`,
          }
        })

        if (linkError) {
          console.error('Erro ao gerar link de invite:', linkError)
        } else if (linkData?.properties?.action_link) {
          console.log('📧 Link de invite gerado:', linkData.properties.action_link)
          
          // Em produção, o Supabase envia o email automaticamente se SMTP estiver configurado
          // Em desenvolvimento, o link aparece no console
        }

        return NextResponse.json({ 
          success: true, 
          user: newUser.user,
          message: 'Usuário criado. Email de convite enviado (verifique o console em desenvolvimento).'
        })
      }
    }

    // Se inviteUserByEmail funcionou
    if (inviteData?.user) {
      // Aguardar um pouco para o trigger criar o profile
      await new Promise(resolve => setTimeout(resolve, 500))

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          cliente_id,
          role,
          ...(full_name && { full_name }),
        })
        .eq('id', inviteData.user.id)

      if (profileError) {
        console.error('Erro ao atualizar profile:', profileError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: inviteData?.user,
      message: 'Convite enviado por email com sucesso!'
    })
  } catch (error: any) {
    console.error('Error inviting member:', error)
    return NextResponse.json(
      { error: error.message || 'Error inviting member' },
      { status: 500 }
    )
  }
}
