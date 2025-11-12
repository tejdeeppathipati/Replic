import { NextResponse } from "next/server";

/**
 * API Route: POST /api/auth/logout
 * Clears authentication/session cookies stored on the server.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  response.cookies.delete('server-instance-id');
  response.cookies.delete('server-start-time');

  return response;
}
