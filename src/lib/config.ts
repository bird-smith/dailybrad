// Reads the two public database settings. Both are safe to ship in the site.
const NAMES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'] as const

export type Config =
  | { ok: true; url: string; publishableKey: string }
  | { ok: false; missing: string[] }

export function readConfig(env: Record<string, string | undefined>): Config {
  const [url, publishableKey] = NAMES.map((name) => env[name]?.trim() ?? '')
  const missing = NAMES.filter((_, i) => ![url, publishableKey][i])
  if (missing.length > 0) return { ok: false, missing }
  return { ok: true, url, publishableKey }
}
