import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

    // Se falhar (ex: usuário já existe), tentar enviar magic link (OTP) de verdade
    if (inviteError) {
      console.warn('inviteUserByEmail falhou, tentando enviar magic link via OTP:', inviteError.message)

      const otpClient = createAdminClient(supabaseUrl, supabaseAnonKey)
      const { error: otpError } = await otpClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/signup`,
        },
      })

      if (otpError) {
        return NextResponse.json(
          {
            error: `Falha ao reenviar convite por email. Motivo: ${inviteError.message}. Falha ao enviar magic link: ${otpError.message}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Email reenviado com sucesso!'
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
