import { NextRequest, NextResponse } from "next/server";
import { getUserConnections } from "@/lib/composio-client";
import { withAuth } from "@/lib/api-auth";

/**
 * API Route: GET /api/composio/connections?userId=xxx
 * Gets all connected accounts for a user
 * 
 * Query params: { userId: string }
 * Returns: Array of connected accounts with status
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    console.log("🔍 [API] Fetching connections...");
    
    // Check if COMPOSIO_API_KEY is set
    if (!process.env.COMPOSIO_API_KEY) {
      console.error("❌ [API] COMPOSIO_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "COMPOSIO_API_KEY is not configured. Please add it to your .env file." },
        { status: 500 }
      );
    }

    const userId = user.id;
    console.log("📋 [API] Authenticated userId:", userId);

    console.log("🌐 [API] Calling Composio API...");
    const connections = await getUserConnections(userId);
    
    console.log(`✅ [API] Successfully fetched ${connections.length} connection(s)`);
    
    // Log first connection with ALL fields to see what's available
    if (connections.length > 0) {
      console.log("🔍 [API] First connection ALL FIELDS:");
      console.log(JSON.stringify(connections[0], null, 2));
      console.log("🔍 [API] Available keys:", Object.keys(connections[0]));
    }
    
    console.log("📦 [API] Connections:", JSON.stringify(connections, null, 2));

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("❌ [API] Error fetching connections:", error);
    console.error("❌ [API] Error stack:", error.stack);
    console.error("❌ [API] Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch connections",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
});
