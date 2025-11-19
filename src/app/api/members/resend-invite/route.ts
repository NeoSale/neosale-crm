import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email } = await request.json()

    // Check if user is authenticated and has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if requester has admin permissions
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!requesterProfile || !['admin', 'super_admin'].includes(requesterProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resend invitation email
    const { error: resendError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })

    if (resendError) throw resendError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error resending invite:', error)
    return NextResponse.json(
      { error: error.message || 'Error resending invite' },
      { status: 500 }
    )
  }
}
