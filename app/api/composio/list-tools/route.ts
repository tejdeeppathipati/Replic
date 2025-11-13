import { NextRequest, NextResponse } from "next/server";
import { getUserTools } from "@/lib/composio-client";
import { withAuth } from "@/lib/api-auth";

/**
 * Diagnostic endpoint to list available tools
 * 
 * SECURITY: Requires authentication - uses authenticated user ID
 * 
 * GET /api/composio/list-tools?toolkit=TWITTER
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const toolkit = searchParams.get("toolkit") || "TWITTER";

    // Use authenticated user ID (never trust userId from query params)
    const userId = user.id;

    console.log(`\n🔍 [LIST TOOLS] Fetching ${toolkit} tools for user: ${userId}`);

    const tools = await getUserTools(userId, [toolkit]);
    
    console.log(`\n✅ [LIST TOOLS] Found ${tools.length} ${toolkit} tools\n`);
    
    // Log first tool completely to see structure
    if (tools.length > 0) {
      console.log(`\n━━━ FIRST TOOL COMPLETE STRUCTURE ━━━`);
      console.log(JSON.stringify(tools[0], null, 2));
      console.log(`Keys:`, Object.keys(tools[0]));
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    // Log ALL tool names - they're at tool.function.name
    tools.forEach((tool: any, index: number) => {
      const toolName = tool.function?.name || tool.name || "Unknown";
      const toolDesc = tool.function?.description || tool.description || "No description";
      
      console.log(`${index + 1}. ${toolName}`);
      console.log(`   Description: ${toolDesc.substring(0, 100)}...`);
    });
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return NextResponse.json({
      success: true,
      userId,
      toolkit,
      toolCount: tools.length,
      fullTools: tools, // Return the complete tool objects
      tools: tools.map((t: any) => ({
        name: t.function?.name || t.name,
        description: t.function?.description || t.description,
        type: t.type,
        allKeys: Object.keys(t),
      })),
    });
  } catch (error: any) {
    console.error("❌ [LIST TOOLS] Error:", error);
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

