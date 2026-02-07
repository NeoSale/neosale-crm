import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/utils/runtime-config'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Placeholder values for build-time
const BUILD_PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const BUILD_PLACEHOLDER_KEY = 'placeholder-key'

/**
 * Checks if we're in a build/SSR context (not browser)
 */
function isBuildTime(): boolean {
  return typeof window === 'undefined'
}

/**
 * Gets Supabase config from runtime config (window.__RUNTIME_CONFIG__) or process.env
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = getSupabaseUrl() || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = getSupabaseAnonKey() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return { url, anonKey }
}

export function createClient() {
  if (!supabaseClient) {
    let { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

    // During build-time, use placeholder to not break static generation
    if (isBuildTime() && (!supabaseUrl || !supabaseAnonKey)) {
      supabaseUrl = BUILD_PLACEHOLDER_URL
      supabaseAnonKey = BUILD_PLACEHOLDER_KEY
    }

    // At runtime (browser), validate and warn if missing
    if (!isBuildTime() && (!supabaseUrl || !supabaseAnonKey)) {
      console.error(
        '❌ Supabase URL e Anon Key são obrigatórios. ' +
        'Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
      // Use placeholders to prevent crash, but functionality won't work
      supabaseUrl = supabaseUrl || BUILD_PLACEHOLDER_URL
      supabaseAnonKey = supabaseAnonKey || BUILD_PLACEHOLDER_KEY
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
