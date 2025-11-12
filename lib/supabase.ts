/**
 * Supabase Client Configuration
 * 
 * Creates Supabase clients for both client-side and server-side usage.
 */

import { createClient } from '@supabase/supabase-js';

// Types for our database schema
export type Database = {
  public: {
    Tables: {
      app_user: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone_number: string | null;
          whatsapp_number: string | null;
          imessage_contact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
          whatsapp_number?: string | null;
          imessage_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          whatsapp_number?: string | null;
          imessage_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_agent: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          platform_handles: Record<string, any>;
          brand_brief: string | null;
          brand_voice: string | null;
          faqs: any[] | null;
          important_links: any[] | null;
          persona: 'normal' | 'smart' | 'technical' | 'unhinged';
          keywords: string[];
          watched_accounts: string[];
          watched_subreddits: string[] | null;
          mode: 'auto' | 'approve';
          approval_timeout_sec: number;
          daily_reply_cap: number;
          per_user_cap: number;
          min_reply_spacing_sec: number;
          owner_whatsapp: string | null;
          owner_imessage: string | null;
          is_active: boolean;
          last_poll_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          platform_handles?: Record<string, any>;
          brand_brief?: string | null;
          brand_voice?: string | null;
          faqs?: any[] | null;
          important_links?: any[] | null;
          persona?: 'normal' | 'smart' | 'technical' | 'unhinged';
          keywords?: string[];
          watched_accounts?: string[];
          watched_subreddits?: string[] | null;
          mode?: 'auto' | 'approve';
          approval_timeout_sec?: number;
          daily_reply_cap?: number;
          per_user_cap?: number;
          min_reply_spacing_sec?: number;
          owner_whatsapp?: string | null;
          owner_imessage?: string | null;
          is_active?: boolean;
          last_poll_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          platform_handles?: Record<string, any>;
          brand_brief?: string | null;
          brand_voice?: string | null;
          faqs?: any[] | null;
          important_links?: any[] | null;
          persona?: 'normal' | 'smart' | 'technical' | 'unhinged';
          keywords?: string[];
          watched_accounts?: string[];
          watched_subreddits?: string[] | null;
          mode?: 'auto' | 'approve';
          approval_timeout_sec?: number;
          daily_reply_cap?: number;
          per_user_cap?: number;
          min_reply_spacing_sec?: number;
          owner_whatsapp?: string | null;
          owner_imessage?: string | null;
          is_active?: boolean;
          last_poll_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
  };
};

// Singleton Supabase client for client-side use
// This prevents multiple GoTrueClient instances
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Client-side Supabase client (for use in React components)
export function createSupabaseClient() {
  // Return existing client if it exists (singleton pattern)
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time (Vercel), return a mock client if env vars are missing
  // This allows the build to succeed, but you MUST add env vars in Vercel for runtime
  const isBuildTime = process.env.VERCEL === '1' || process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('⚠️  Supabase env vars missing during build. Using placeholder values.');
    console.warn('⚠️  Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel settings!');
    // Return a client with placeholder values - will fail at runtime if actually used
    supabaseClient = createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
    return supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  // Create and cache the client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseClient;
}

// Server-side Supabase client (for API routes and server components)
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time (Vercel), return a mock client if env vars are missing
  // This allows the build to succeed, but you MUST add env vars in Vercel for runtime
  const isBuildTime = process.env.VERCEL === '1' || process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('⚠️  Supabase env vars missing during build. Using placeholder values.');
    console.warn('⚠️  Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel settings!');
    return createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Admin client with service role key (for server-side operations)
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase service role key. This is required for admin operations.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// React hook for client components
export function useSupabase() {
  return createSupabaseClient();
}

