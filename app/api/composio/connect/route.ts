import { NextRequest, NextResponse } from "next/server";
import { initiateConnection, IntegrationType } from "@/lib/composio-client";

/**
 * API Route: POST /api/composio/connect
 * Initiates OAuth connection for Twitter or Reddit
 * 
 * Body: { userId: string, integration: "TWITTER" | "REDDIT" }
 * Returns: { redirectUrl: string, connectionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, integration } = body;

    // Validate input
    if (!userId || !integration) {
      return NextResponse.json(
        { error: "userId and integration are required" },
        { status: 400 }
      );
    }

    if (!["TWITTER", "REDDIT"].includes(integration)) {
      return NextResponse.json(
        { error: "integration must be TWITTER or REDDIT" },
        { status: 400 }
      );
    }

    // Get the base URL from request or environment
    const baseUrl = 
      process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      request.headers.get('origin') || 
      (request.headers.get('host') ? `https://${request.headers.get('host')}` : null);
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Could not determine callback URL. Please set NEXT_PUBLIC_APP_URL in environment variables." },
        { status: 500 }
      );
    }
    
    const callbackUrl = `${baseUrl}/dashboard/integrations?connection=success`;

    // Initiate connection with Composio
    const result = await initiateConnection(
      userId,
      integration as IntegrationType,
      callbackUrl
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error initiating connection:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

