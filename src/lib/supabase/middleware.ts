import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:5000'

// Rotas que não requerem autenticação
const PUBLIC_ROUTES = ['/callback', '/api/health']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Permitir acesso a rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Durante build, não verificar autenticação
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Se não autenticado, redirecionar para auth externo
  if (!user) {
    const redirectUrl = request.nextUrl.origin
    const loginUrl = `${AUTH_URL}/login?redirect_url=${encodeURIComponent(redirectUrl)}`
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
