// Runtime configuration utility
// Priority: window.__RUNTIME_CONFIG__ (Docker/EasyPanel) > process.env (build-time)

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_API_URL?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}

/**
 * Gets runtime config value with fallback to process.env
 * @param key Configuration key (e.g., 'NEXT_PUBLIC_API_URL')
 * @param defaultValue Default value if not found
 * @returns Configuration value
 */
function getConfig(key: keyof NonNullable<Window['__RUNTIME_CONFIG__']>, defaultValue = ''): string {
  // In browser: check window.__RUNTIME_CONFIG__ first (Docker runtime)
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.[key]) {
    return window.__RUNTIME_CONFIG__[key] || defaultValue;
  }

  // Fallback to process.env (build-time for Next.js)
  const envKey = key as string;
  return process.env[envKey] || defaultValue;
}

/**
 * Gets the API URL from runtime or environment config
 * @returns API URL
 */
export function getApiUrl(): string {
  return getConfig('NEXT_PUBLIC_API_URL', '');
}

/**
 * Gets App URL from runtime or environment config
 * @returns App URL
 */
export function getAppUrl(): string {
  return getConfig('NEXT_PUBLIC_APP_URL', '');
}

/**
 * Gets Supabase URL from runtime or environment config
 * @returns Supabase URL
 */
export function getSupabaseUrl(): string {
  return getConfig('NEXT_PUBLIC_SUPABASE_URL', '');
}

/**
 * Gets Supabase anon key from runtime or environment config
 * @returns Supabase anon key
 */
export function getSupabaseAnonKey(): string {
  return getConfig('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
}

/**
 * Gets a specific configuration value
 * @param key Configuration key
 * @param defaultValue Default value
 * @returns Configuration value
 */
export function getRuntimeConfig(key: string, defaultValue?: string): string | undefined {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    const runtimeKey = key as keyof typeof window.__RUNTIME_CONFIG__;
    if (window.__RUNTIME_CONFIG__[runtimeKey]) {
      return window.__RUNTIME_CONFIG__[runtimeKey];
    }
  }
  return process.env[key] || defaultValue;
}

/**
 * Checks if API URL is configured
 * @returns true if API URL is configured
 */
export function isApiConfigured(): boolean {
  return !!getApiUrl();
}

/**
 * Logs configuration for debugging
 */
export function logConfig(): void {
  console.log('🔧 Runtime Config:');
  console.log('  - API URL:', getApiUrl());
  console.log('  - Supabase URL:', getSupabaseUrl());
  console.log('  - Source:', typeof window !== 'undefined' && window.__RUNTIME_CONFIG__ ? 'runtime' : 'build-time');
}