import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: POST /api/composio/post-reddit
 * Posts to Reddit using Composio
 * 
 * Body: { 
 *   userId: string, 
 *   subreddit: string,
 *   title: string,
 *   kind: "self" | "link",
 *   text?: string,  // for self posts
 *   url?: string,   // for link posts
 *   flair_id?: string
 * }
 * Returns: { success: boolean, postId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subreddit, title, kind, text, url, flair_id } = body;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔶 [POST REDDIT] Request received`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Subreddit: r/${subreddit}`);
    console.log(`   Title: "${title}"`);
    console.log(`   Kind: ${kind}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Validate input
    if (!userId || !subreddit || !title || !kind) {
      console.error("❌ [POST REDDIT] Missing required fields");
      return NextResponse.json(
        { error: "userId, subreddit, title, and kind are required" },
        { status: 400 }
      );
    }

    if (kind === "self" && !text) {
      console.error("❌ [POST REDDIT] Self posts require text");
      return NextResponse.json(
        { error: "text is required for self posts" },
        { status: 400 }
      );
    }

    if (kind === "link" && !url) {
      console.error("❌ [POST REDDIT] Link posts require url");
      return NextResponse.json(
        { error: "url is required for link posts" },
        { status: 400 }
      );
    }

    // Get Reddit connections to find the connected account ID
    console.log(`🔍 [POST REDDIT] Getting Reddit connections...`);
    const { getUserConnections } = await import("@/lib/composio-client");
    const connections = await getUserConnections(userId);
    
    console.log(`📋 [POST REDDIT] Total connections: ${connections.length}`);
    
    // Find the Reddit connection
    const redditConnection = connections.find((conn: any) => {
      let integrationStr = "";
      if (typeof conn.integration === 'object' && conn.integration !== null) {
        integrationStr = String(conn.integration.slug || conn.integration.name || "").toLowerCase();
      } else {
        integrationStr = String(conn.integration || "").toLowerCase();
      }
      
      const appName = String(conn.appName || "").toLowerCase();
      const appUniqueId = String(conn.appUniqueId || "").toLowerCase();
      
      const isReddit = integrationStr.includes("reddit") || 
                       appName.includes("reddit") ||
                       appUniqueId.includes("reddit");
      
      console.log(`   Checking ${conn.id}: integration="${integrationStr}", isReddit=${isReddit}, status=${conn.status}`);
      
      return conn.status === "ACTIVE" && isReddit;
    });
    
    if (!redditConnection) {
      console.error("❌ [POST REDDIT] No active Reddit connection found");
      return NextResponse.json(
        { error: "Reddit not connected. Please connect Reddit in the Integrations page first." },
        { status: 400 }
      );
    }

    console.log(`✅ [POST REDDIT] Found active Reddit connection: ${redditConnection.id}`);
    
    // Get available Reddit tools
    console.log(`🔍 [POST REDDIT] Fetching available Reddit tools...`);
    const { getUserTools } = await import("@/lib/composio-client");
    const tools = await getUserTools(userId, ["REDDIT"]);
    
    console.log(`📋 [POST REDDIT] Found ${tools.length} Reddit tools`);
    
    // Log first tool structure if available
    if (tools.length > 0) {
      console.log(`\n🔍 [DEBUG] First Reddit tool structure:`);
      console.log(JSON.stringify(tools[0], null, 2));
      console.log(`Keys:`, Object.keys(tools[0]));
    }
    
    const toolNames = tools.map((t: any) => t.function?.name || t.name || "unknown");
    console.log(`📋 [POST REDDIT] Available tool names:`, toolNames.slice(0, 20));
    
    // Try multiple possible tool names (case-insensitive search)
    const possibleNames = [
      "REDDIT_CREATE_REDDIT_POST",
      "REDDIT_CREATE_A_REDDIT_POST", 
      "REDDIT_POST",
      "REDDIT_CREATE_POST",
    ];
    
    // Find the posting tool - check multiple possible names
    let postingTool = tools.find((t: any) => {
      const name = (t.function?.name || t.name || "").toUpperCase();
      return possibleNames.some(possible => name.includes(possible.toUpperCase()));
    });
    
    // If still not found, look for any tool with "CREATE" and "POST" in the name
    if (!postingTool) {
      postingTool = tools.find((t: any) => {
        const name = (t.function?.name || t.name || "").toLowerCase();
        return name.includes("create") && name.includes("post") && !name.includes("delete");
      });
    }
    
    if (!postingTool) {
      console.error(`❌ [POST REDDIT] No posting tool found`);
      console.error(`   Available: ${toolNames.join(", ")}`);
      console.error(`   Tried: ${possibleNames.join(", ")}`);
      return NextResponse.json(
        { 
          error: "Reddit posting tool not found. Please reconnect Reddit with proper permissions.",
          availableTools: toolNames.slice(0, 10),
        },
        { status: 500 }
      );
    }
    
    const toolName = postingTool.function?.name || postingTool.name;
    console.log(`✅ [POST REDDIT] Found posting tool: ${toolName}`);
    console.log(`📡 [POST REDDIT] Posting to Reddit...`);
    console.log(`   Connected Account: ${redditConnection.id}`);

    // Build the parameters based on post type
    const params: any = {
      subreddit: subreddit,
      title: title,
      kind: kind,
      flair_id: flair_id || "",
    };

    if (kind === "self") {
      params.text = text;
    } else {
      params.url = url;
    }

    console.log(`   Parameters:`, params);

    // Execute the Reddit posting tool
    const { composioClient } = await import("@/lib/composio-client");
    
    const result = await composioClient.tools.execute(
      toolName,
      {
        userId: userId,
        connectedAccountId: redditConnection.id,
        arguments: params,
      }
    );

    console.log(`\n✅✅✅ [POST REDDIT] Post created successfully!`);
    console.log(`   Result:`, JSON.stringify(result, null, 2));
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Extract post details from result
    const postData = result.data || result;
    const postId = postData.id || postData.name;
    const postUrl = postData.url || (postId ? `https://reddit.com/comments/${postId}` : null);

    return NextResponse.json({
      success: true,
      message: "Reddit post created successfully",
      postId,
      url: postUrl,
      fullResult: postData,
    });

  } catch (error: any) {
    console.error(`\n❌❌❌ [POST REDDIT] Error creating post:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create Reddit post",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

