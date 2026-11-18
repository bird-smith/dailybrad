import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readConfig } from './config'

const config = readConfig(import.meta.env)

// The one shared database connection. null when the settings are missing, so screens can
// say "isn't connected" instead of breaking.
export const supabase: SupabaseClient | null = config.ok
  ? createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Sign-in links in the address bar would clash with the site's #/ addresses.
        detectSessionInUrl: false,
      },
    })
  : null
