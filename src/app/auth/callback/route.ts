import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Se o usuário não tem senha definida (veio de invite), redirecionar para signup
      // Verificar se é um usuário convidado que precisa definir senha
      const user = data.user
      const isInvitedUser = user.user_metadata?.invited_by || 
                           user.app_metadata?.provider === 'email' && !user.confirmed_at
      
      if (isInvitedUser || next.includes('signup')) {
        return NextResponse.redirect(`${origin}/signup`)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`)
}
