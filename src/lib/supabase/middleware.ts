import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Placeholder values for build-time
const BUILD_PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const BUILD_PLACEHOLDER_KEY = 'placeholder-key'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get URL and key with fallback to placeholders during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || BUILD_PLACEHOLDER_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || BUILD_PLACEHOLDER_KEY

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // TEMPORÁRIO: Desabilitar verificação de autenticação no middleware
  // O AuthContext no cliente vai gerenciar a autenticação
  // Isso permite que o login funcione sem depender de cookies SSR
  
  // Debug: listar cookies
  const allCookies = request.cookies.getAll()
  console.log('Middleware - cookies:', allCookies.map(c => c.name).join(', '))
  
  // Verificar se há token de autenticação nos cookies
  const hasAuthCookie = allCookies.some(c => c.name.includes('auth-token'))
  
  if (hasAuthCookie) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    console.log('Middleware - user:', user?.email || 'não autenticado')
  } else {
    console.log('Middleware - sem cookie de auth, permitindo acesso (AuthContext vai verificar)')
  }
  
  // Por enquanto, não redirecionar - deixar o AuthContext gerenciar
  // O redirecionamento será feito no cliente se necessário

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
