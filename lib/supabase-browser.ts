/**
 * Supabase Browser Client (Simplified)
 *
 * Standard production Supabase client with cookie-based session management
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

// Singleton client instance
let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get the Supabase browser client (with automatic cookie handling)
 * This manages sessions automatically using browser storage
 */
export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create browser client with session persistence
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          const value = localStorage.getItem(key);
          // Also sync to cookie when reading
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.access_token) {
                document.cookie = `sb-access-token=${parsed.access_token}; path=/; max-age=604800; SameSite=Lax`;
              }
            } catch (e) {
              // Value might not be JSON
            }
          }
          return value;
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
          // Extract access token and set cookie (MUST match middleware cookie name)
          try {
            const parsed = JSON.parse(value);
            if (parsed.access_token) {
              document.cookie = `sb-access-token=${parsed.access_token}; path=/; max-age=604800; SameSite=Lax`;
            }
          } catch (e) {
            // Value might not be JSON
          }
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
          // Remove the cookie
          document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        },
      },
    },
  });

  return client;
}
