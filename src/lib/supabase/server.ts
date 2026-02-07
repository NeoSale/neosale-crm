import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Placeholder values for build-time (Next.js static generation)
const BUILD_PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const BUILD_PLACEHOLDER_KEY = 'placeholder-key'

export async function createClient() {
  const cookieStore = await cookies()

  // Get URL and key with fallback to placeholders during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || BUILD_PLACEHOLDER_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || BUILD_PLACEHOLDER_KEY

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
