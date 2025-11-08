import { NextRequest, NextResponse } from "next/server";
import { executeTool, hasActiveConnection } from "@/lib/composio-client";

/**
 * API Route: POST /api/composio/post-tweet
 * Posts a tweet to Twitter using Composio
 * 
 * Body: { userId: string, text: string }
 * Returns: { success: boolean, tweetId?: string, url?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, text } = body;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🐦 [POST TWEET] Request received`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Tweet text: "${text}"`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Validate input
    if (!userId || !text) {
      console.error("❌ [POST TWEET] Missing required fields");
      return NextResponse.json(
        { error: "userId and text are required" },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      console.error("❌ [POST TWEET] Tweet too long");
      return NextResponse.json(
        { error: "Tweet must be 280 characters or less" },
        { status: 400 }
      );
    }

    // Get Twitter connections to find the connected account ID
    console.log(`🔍 [POST TWEET] Getting Twitter connections...`);
    const { getUserConnections } = await import("@/lib/composio-client");
    const connections = await getUserConnections(userId);
    
    console.log(`📋 [POST TWEET] Total connections: ${connections.length}`);
    
    // Find the Twitter connection - check integration object and all fields
    const twitterConnection = connections.find((conn: any) => {
      // Handle integration being an object with slug
      let integrationStr = "";
      if (typeof conn.integration === 'object' && conn.integration !== null) {
        integrationStr = String(conn.integration.slug || conn.integration.name || "").toLowerCase();
      } else {
        integrationStr = String(conn.integration || "").toLowerCase();
      }
      
      const appName = String(conn.appName || "").toLowerCase();
      const appUniqueId = String(conn.appUniqueId || "").toLowerCase();
      
      const isTwitter = integrationStr.includes("twitter") || 
                       integrationStr.includes("x") ||
                       appName.includes("twitter") ||
                       appUniqueId.includes("twitter");
      
      console.log(`   Checking ${conn.id}: integration="${integrationStr}", appName="${appName}", isTwitter=${isTwitter}, status=${conn.status}`);
      
      return conn.status === "ACTIVE" && isTwitter;
    });
    
    if (!twitterConnection) {
      console.error("❌ [POST TWEET] No active Twitter connection found");
      console.error("   Available connections:", connections.map(c => ({
        id: c.id,
        integration: c.integration,
        status: c.status
      })));
      return NextResponse.json(
        { error: "Twitter not connected. Please connect Twitter in the Integrations page first." },
        { status: 400 }
      );
    }

    console.log(`✅ [POST TWEET] Found active Twitter connection: ${twitterConnection.id}`);
    
    // First, get available Twitter tools to find the correct tool name
    console.log(`🔍 [POST TWEET] Fetching available Twitter tools...`);
    const { getUserTools } = await import("@/lib/composio-client");
    const tools = await getUserTools(userId, ["TWITTER"]);
    
    console.log(`📋 [POST TWEET] Found ${tools.length} Twitter tools`);
    
    // Extract tool names - they're at tool.function.name!
    const toolNames = tools.map((t: any) => t.function?.name || t.name || "unknown");
    console.log(`📋 [POST TWEET] Available tool names:`, toolNames.slice(0, 10));
    
    // Find the posting tool - look for "CREATION_OF_A_POST"
    const postingTool = tools.find((t: any) => {
      const name = t.function?.name || t.name || "";
      return name === "TWITTER_CREATION_OF_A_POST" || 
             name === "TWITTER_POST_TWEET" ||
             name === "TWITTER_CREATE_TWEET";
    });
    
    if (!postingTool) {
      console.error(`❌ [POST TWEET] No posting tool found in available tools`);
      console.error(`   Available: ${toolNames.join(", ")}`);
      throw new Error("Unable to find Twitter posting tool. Please reconnect Twitter with tweet.write permissions.");
    }
    
    const toolName = postingTool.function?.name || postingTool.name;
    console.log(`✅ [POST TWEET] Found posting tool: ${toolName}`);
    console.log(`📡 [POST TWEET] Posting tweet...`);
    console.log(`   Connected Account: ${twitterConnection.id}`);
    console.log(`   Text: "${text}"`);

    // Execute the tweet posting tool
    const { composioClient } = await import("@/lib/composio-client");
    
    // Execute with the connected account ID (version is set at client level)
    const result = await composioClient.tools.execute(
      toolName,
      {
        userId: userId,
        connectedAccountId: twitterConnection.id,
        arguments: { text },
      }
    );

    console.log(`\n✅✅✅ [POST TWEET] Tweet posted successfully!`);
    console.log(`   Result:`, JSON.stringify(result, null, 2));
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Extract tweet details from result
    const tweetData = result.data || result;
    const tweetId = tweetData.id || tweetData.tweet_id || tweetData.id_str;
    const tweetUrl = tweetId 
      ? `https://twitter.com/i/web/status/${tweetId}`
      : null;

    return NextResponse.json({
      success: true,
      message: "Tweet posted successfully",
      tweetId,
      url: tweetUrl,
      fullResult: tweetData,
    });

  } catch (error: any) {
    console.error(`\n❌❌❌ [POST TWEET] Error posting tweet:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Provide helpful error messages
    let errorMessage = error.message || "Failed to post tweet";
    
    if (errorMessage.includes("Unable to retrieve tool")) {
      errorMessage = "Twitter posting tool not found. This might be a scoping issue with your Twitter auth config.";
    } else if (errorMessage.includes("not connected")) {
      errorMessage = "Twitter not connected. Please connect Twitter in Integrations first.";
    } else if (errorMessage.includes("unauthorized") || errorMessage.includes("403")) {
      errorMessage = "Twitter authorization failed. Please reconnect Twitter with proper permissions.";
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.toString(),
        hint: "Check that Twitter is connected with tweet.write permissions in the Integrations page.",
      },
      { status: 500 }
    );
  }
}

