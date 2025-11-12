/**
 * Authentication Utilities
 *
 * Helper functions for authentication and authorization
 */

import { createSupabaseClient } from './supabase';
import { NextRequest } from 'next/server';

/**
 * Get the current authenticated user from the client
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  try {
    const supabase = createSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Register or refresh the server-side session cookies so middleware can validate auth.
 */
export async function syncServerSession(
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
) {
  if (!accessToken) return null;

  try {
    const response = await fetch('/api/auth/register-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
        expiresIn,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to sync server session (${response.status})`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server session sync returned non-JSON response: ${text.slice(0, 100)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to sync server session:', error);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }

    // Clear server-side cookies
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (logoutError) {
      console.error('Failed to clear server session cookies:', logoutError);
    }

    // Clear any local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('replic_onboarded');
      localStorage.removeItem('replic_config');
    }

    return { success: true };
  } catch (error) {
    console.error('Exception signing out:', error);
    throw error;
  }
}

/**
 * Get user profile data (name, email, etc.)
 */
export async function getUserProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = createSupabaseClient();
    const { data, error } = await (supabase as any)
      .from('app_user')
      .select('id, email, full_name, first_name, last_name, phone_number')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // ignore "row not found" errors
      console.error('Error getting user profile:', error);
    }

    if (data) {
      return data;
    }

    // Fall back to auth metadata if no row in app_user
    const metadata = (user as any)?.user_metadata || {};
    return {
      id: user.id,
      email: user.email || metadata.email || '',
      full_name: metadata.full_name || metadata.name || null,
      first_name: metadata.first_name || null,
      last_name: metadata.last_name || null,
      phone_number: metadata.phone_number || null,
    };
  } catch (error) {
    console.error('Exception getting user profile:', error);
    return null;
  }
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Server-side auth check for API routes
 * Returns user ID if authenticated, throws error if not
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  try {
    const supabase = createSupabaseClient();

    // Try to get user from session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Unauthorized: No valid session');
    }

    return user.id;
  } catch (error) {
    throw new Error('Unauthorized: Authentication required');
  }
}

/**
 * Verify that a resource belongs to the authenticated user
 * Throws error if unauthorized
 */
export async function verifyResourceOwnership(
  resourceUserId: string,
  authenticatedUserId: string
): Promise<void> {
  if (resourceUserId !== authenticatedUserId) {
    throw new Error('Forbidden: You do not have access to this resource');
  }
}

/**
 * Check if user owns a specific brand/project
 */
export async function verifyBrandOwnership(
  brandId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await (supabase as any)
      .from('brand_agent')
      .select('id, user_id')
      .eq('id', brandId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying brand ownership:', error);
    return false;
  }
}
