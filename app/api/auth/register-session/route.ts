import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";

/**
 * API Route: POST /api/auth/register-session
 * Register a client session with the server
 *
 * SECURITY: Requires authentication
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Extract session ID from the auth header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Parse optional body data (refresh token, expiry, etc.)
    let refreshToken: string | undefined;
    let expiresInSeconds: number | undefined;
    try {
      const body = await request.json();
      refreshToken = body?.refreshToken;
      expiresInSeconds = typeof body?.expiresIn === 'number' ? body.expiresIn : undefined;
    } catch (_) {
      // Body is optional - ignore JSON parsing errors
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No session token provided' },
        { status: 400 }
      );
    }

    console.log(`📋 [REGISTER SESSION] Setting session cookies for user ${user.id}`);

    const response = NextResponse.json({
      success: true,
      message: 'Session registered',
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // Set Supabase access token cookie so middleware can validate auth state
    response.cookies.set('sb-access-token', token, {
      ...cookieOptions,
      maxAge: expiresInSeconds && expiresInSeconds > 0
        ? expiresInSeconds
        : 60 * 60, // fallback to 1 hour
    });

    if (refreshToken) {
      response.cookies.set('sb-refresh-token', refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    console.log(`✅ [REGISTER SESSION] Session cookies set successfully`);

    return response;
  } catch (error: any) {
    console.error("❌ [REGISTER SESSION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register session",
      },
      { status: 500 }
    );
  }
});
