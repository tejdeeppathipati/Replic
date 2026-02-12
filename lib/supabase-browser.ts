/**
 * Supabase Browser Client (Simplified)
 *
 * Standard production Supabase client for client-side usage.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';
import { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } from './env-public';

// Singleton client instance
let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get the Supabase browser client.
 * Sessions are persisted in browser storage; server session cookies (for middleware) are managed separately.
 */
export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(`Invalid protocol: ${parsed.protocol}`);
    }
  } catch (e) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a full URL like "https://<project-ref>.supabase.co".'
    );
  }

  // Create browser client with session persistence.
  // NOTE: Do not write auth tokens into `document.cookie` here. We set httpOnly cookies via `/api/auth/register-session`.
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
