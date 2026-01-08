import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)
    
    // Buscar usuário
    const { data: users } = await adminClient.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      identities: user.identities?.map(i => ({
        provider: i.provider,
        created_at: i.created_at,
        last_sign_in_at: i.last_sign_in_at,
      })),
      user_metadata: user.user_metadata,
      // Verificar identities
      has_email_identity: user.identities?.some(i => i.provider === 'email'),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
