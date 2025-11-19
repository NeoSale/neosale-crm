import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, role, client_id } = await request.json()

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

    // Create user in Supabase Auth (this will send the invitation email)
    const { data: newUser, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_by: user.id,
        client_id,
        role,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })

    if (createError) throw createError

    // If user was created, add them to client_members
    if (newUser.user) {
      const { error: memberError } = await supabase
        .from('client_members')
        .insert({
          user_id: newUser.user.id,
          client_id,
          role,
        })

      if (memberError) throw memberError
    }

    return NextResponse.json({ success: true, user: newUser.user })
  } catch (error: any) {
    console.error('Error inviting member:', error)
    return NextResponse.json(
      { error: error.message || 'Error inviting member' },
      { status: 500 }
    )
  }
}
