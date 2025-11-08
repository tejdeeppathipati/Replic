import { NextRequest, NextResponse } from "next/server";
import { disconnectAccount } from "@/lib/composio-client";

/**
 * API Route: POST /api/composio/disconnect
 * Disconnects a connected account
 * 
 * Body: { connectedAccountId: string }
 * Returns: { success: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectedAccountId } = body;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔌 [DISCONNECT] Request received`);
    console.log(`   Account ID: ${connectedAccountId}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (!connectedAccountId) {
      console.error("❌ [DISCONNECT] Missing connectedAccountId");
      return NextResponse.json(
        { error: "connectedAccountId is required" },
        { status: 400 }
      );
    }

    console.log(`🗑️ [DISCONNECT] Calling Composio API to delete connection...`);
    await disconnectAccount(connectedAccountId);

    console.log(`\n✅✅✅ [DISCONNECT] Successfully deleted connection ${connectedAccountId} from Composio`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return NextResponse.json({ 
      success: true,
      message: "Account disconnected successfully",
      connectedAccountId,
    });
  } catch (error: any) {
    console.error(`\n❌❌❌ [DISCONNECT] Error disconnecting account:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to disconnect account",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

