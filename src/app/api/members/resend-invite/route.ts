import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// URL base da aplicação
const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email } = await request.json()

    // Check if user is authenticated and has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usar admin client para operações administrativas
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

    // Tentar enviar convite usando inviteUserByEmail
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getAppUrl()}/signup`,
    })

    // Se falhar (ex: SMTP não configurado), gerar magic link
    if (inviteError) {
      console.warn('inviteUserByEmail falhou, gerando magic link:', inviteError.message)

      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${getAppUrl()}/signup`,
        }
      })

      if (linkError) {
        throw linkError
      }

      if (linkData?.properties?.action_link) {
        console.log('📧 Magic link gerado para reenvio:', linkData.properties.action_link)
      }

      return NextResponse.json({ 
        success: true,
        message: 'Magic link gerado (verifique o console em desenvolvimento)'
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Convite reenviado por email com sucesso!'
    })
  } catch (error: any) {
    console.error('Error resending invite:', error)
    return NextResponse.json(
      { error: error.message || 'Error resending invite' },
      { status: 500 }
    )
  }
}
