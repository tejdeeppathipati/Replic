import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Authentication Middleware
 *
 * Protects routes that require authentication:
 * - /dashboard/* - Requires active session
 * - /onboarding - Requires active session
 * - /api/* (except public endpoints) - Requires active session
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  try {
    // Get Supabase URL and anon key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware');
      return redirectToLogin(request);
    }

    // Create Supabase client with the request
    const response = NextResponse.next();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Middleware doesn't persist sessions
      },
    });

    // Get the session from cookies
    const token = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (!token) {
      console.log(`🔒 No auth token found for ${pathname}`);
      return redirectToLogin(request);
    }

    // Verify the session
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log(`🔒 Invalid session for ${pathname}:`, error?.message);
      return redirectToLogin(request);
    }

    // User is authenticated, allow access
    console.log(`✅ Authenticated request to ${pathname} by user ${user.id}`);

    // Add user ID to request headers for API routes
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  // Preserve the intended destination
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
