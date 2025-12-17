import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Função para obter as variáveis do Supabase
// Next.js substitui process.env.NEXT_PUBLIC_* em tempo de build, então precisamos acessar diretamente
function getSupabaseConfig(): { url: string; anonKey: string } {
  // Valores do build-time (Next.js substitui essas referências literais)
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  // Se os valores são placeholders ou vazios, tentar runtime config (produção Docker)
  if (!url || url.includes('placeholder') || !anonKey || anonKey.includes('placeholder')) {
    if (typeof window !== 'undefined') {
      const runtimeConfig = (window as unknown as { __RUNTIME_CONFIG__?: Record<string, string> }).__RUNTIME_CONFIG__
      if (runtimeConfig) {
        if (runtimeConfig.NEXT_PUBLIC_SUPABASE_URL && !runtimeConfig.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
          url = runtimeConfig.NEXT_PUBLIC_SUPABASE_URL
        }
        if (runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY && !runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
          anonKey = runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }
    }
  }
  
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
