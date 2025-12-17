import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Função para obter as variáveis do Supabase
// Next.js substitui process.env.NEXT_PUBLIC_* em tempo de build
// Para Docker, as variáveis devem ser passadas em build-time via --build-arg
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return { url, anonKey }
}

export function createClient() {
  if (!supabaseClient) {
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase URL e Anon Key são obrigatórios. ' +
        'Verifique se as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.'
      )
    }
    
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
