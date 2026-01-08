import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    console.log('=== LOGIN API CHAMADA ===')
    const { email, password } = await request.json()
    
    console.log('Email:', email)
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    
    // Criar resposta que será retornada
    const response = NextResponse.json({ success: true })
    
    // Criar cliente Supabase SSR que seta cookies corretamente
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Fazer login - isso vai setar os cookies automaticamente no formato correto
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Resultado login:', data?.user?.email, 'Erro:', error?.message)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Retornar resposta com cookies setados
    return NextResponse.json({ 
      success: true, 
      user: data.user,
      session: data.session,
    }, {
      headers: response.headers,
    })
  } catch (error: any) {
    console.error('Erro no login API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
