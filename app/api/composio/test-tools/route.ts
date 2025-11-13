import { NextRequest, NextResponse } from "next/server";
import { getUserTools, executeTool } from "@/lib/composio-client";
import { withAuth } from "@/lib/api-auth";

/**
 * Test endpoint to verify Composio tools work
 * 
 * SECURITY: Requires authentication - uses authenticated user ID
 * 
 * GET /api/composio/test-tools?toolkit=REDDIT
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const toolkit = searchParams.get("toolkit") || "REDDIT";

    // Use authenticated user ID (never trust userId from query params)
    const userId = user.id;

    console.log(`\n🧪 [TEST] Testing ${toolkit} tools for user: ${userId}`);

    // Get available tools
    const tools = await getUserTools(userId, [toolkit]);
    
    console.log(`✅ [TEST] Found ${tools.length} ${toolkit} tools`);
    console.log(`📋 [TEST] Available tools:`, tools.slice(0, 5).map((t: any) => t.name || t.action?.name));

    return NextResponse.json({
      success: true,
      userId,
      toolkit,
      toolCount: tools.length,
      sampleTools: tools.slice(0, 5).map((t: any) => ({
        name: t.name || t.action?.name,
        description: t.description || t.action?.description,
      })),
    });
  } catch (error: any) {
    console.error("❌ [TEST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
});

