/**
 * API Route Authentication Helpers
 *
 * Use these functions in your API routes to enforce authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from './supabase';

interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Get authenticated user from API request
 * Returns user if authenticated, throws error if not
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    const supabase = createSupabaseClient();

    // Get the session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Unauthorized');
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
}

/**
 * Verify that a brand belongs to the authenticated user
 * Returns true if valid, throws error if not
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
      throw new Error('Forbidden: Access denied to this brand');
    }

    return true;
  } catch (error) {
    throw new Error('Forbidden: Access denied to this brand');
  }
}

/**
 * Wrapper for authenticated API routes
 * Automatically checks auth and returns proper error responses
 *
 * Usage:
 * export const GET = withAuth(async (request, user) => {
 *   // Your authenticated logic here
 *   return NextResponse.json({ data: 'something' });
 * });
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getAuthenticatedUser(request);
      return await handler(request, user);
    } catch (error: any) {
      console.error('Auth error in API route:', error.message);

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for brand-specific API routes
 * Checks both auth and brand ownership
 *
 * Usage:
 * export const GET = withBrandAuth(async (request, user, brandId) => {
 *   // Your authenticated and authorized logic here
 *   return NextResponse.json({ data: 'something' });
 * });
 */
export function withBrandAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, brandId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Check authentication
      const user = await getAuthenticatedUser(request);

      // Get brandId from query params
      const { searchParams } = new URL(request.url);
      const brandId = searchParams.get('brandId');

      if (!brandId) {
        return NextResponse.json(
          { success: false, error: 'brandId is required' },
          { status: 400 }
        );
      }

      // Check authorization
      await verifyBrandOwnership(brandId, user.id);

      // Call the handler with authenticated user and validated brandId
      return await handler(request, user, brandId);
    } catch (error: any) {
      console.error('Auth error in API route:', error.message);

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message.startsWith('Forbidden')) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this brand' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
