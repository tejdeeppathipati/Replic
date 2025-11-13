import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyBrandOwnership } from "@/lib/api-auth";

/**
 * API Route: POST /api/dashboard/engagement
 * Fetch engagement metrics for tweets from X API
 * 
 * SECURITY: Requires authentication and brand ownership verification
 * 
 * Body: { brandId: string, tweetIds: string[] }
 * Returns: { tweetId: { likes, retweets, replies, views } }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { brandId, tweetIds } = body;

    if (!brandId || !tweetIds || !Array.isArray(tweetIds)) {
      return NextResponse.json(
        { error: "brandId and tweetIds array are required" },
        { status: 400 }
      );
    }

    // Verify brand ownership
    try {
      await verifyBrandOwnership(brandId, user.id);
    } catch (error) {
      return NextResponse.json(
        { error: "You do not have access to this brand" },
        { status: 403 }
      );
    }

    console.log(`📊 [ENGAGEMENT] Fetching metrics for ${tweetIds.length} tweets for brand: ${brandId}`);

    // Get Twitter connections to find the connected account
    // Use authenticated user ID, not brandId
    const { getUserConnections } = await import("@/lib/composio-client");
    const connections = await getUserConnections(user.id);
    
    const twitterConnection = connections.find((conn: any) => {
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
      
      return conn.status === "ACTIVE" && isTwitter;
    });
    
    if (!twitterConnection) {
      console.log("⚠️ [ENGAGEMENT] No Twitter connection, returning empty metrics");
      return NextResponse.json({
        success: true,
        metrics: {},
        totals: {
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          total: 0,
        },
        message: "Twitter not connected - engagement metrics unavailable",
      });
    }

    // Fetch engagement metrics for each tweet
    // We'll use Composio's Twitter tools to get tweet details
    const { getUserTools, executeTool } = await import("@/lib/composio-client");
    const tools = await getUserTools(user.id, ["TWITTER"]);
    
    // Find the get tweet tool
    const getTweetTool = tools.find((t: any) => {
      const name = t.function?.name || t.name || "";
      return name.includes("GET_TWEET") || 
             name.includes("GET_A_TWEET") ||
             name.includes("TWITTER_GET_TWEET");
    });

    if (!getTweetTool) {
      console.log("⚠️ [ENGAGEMENT] No get tweet tool found, returning empty metrics");
      return NextResponse.json({
        success: true,
        metrics: {},
        totals: {
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          total: 0,
        },
        message: "Twitter API tool not available",
      });
    }

    const toolSlug = (getTweetTool as any).function?.name || (getTweetTool as any).name;
    const metrics: Record<string, any> = {};
    let totalLikes = 0;
    let totalRetweets = 0;
    let totalReplies = 0;
    let totalViews = 0;

    // Fetch metrics for each tweet (limit to 10 to avoid rate limits)
    const tweetIdsToFetch = tweetIds.slice(0, 10);
    
    for (const tweetId of tweetIdsToFetch) {
      try {
        const result = await executeTool(
          toolSlug,
          user.id,
          { id: tweetId },
          twitterConnection.id
        );

        // Extract public_metrics from result
        const tweetData = (result.data || result || {}) as any;
        const publicMetrics = (tweetData.public_metrics || tweetData.metrics || {}) as any;
        
        const likes = publicMetrics.like_count || publicMetrics.likes || 0;
        const retweets = publicMetrics.retweet_count || publicMetrics.retweets || 0;
        const replies = publicMetrics.reply_count || publicMetrics.replies || 0;
        const views = publicMetrics.impression_count || publicMetrics.views || 0;

        metrics[tweetId] = {
          likes,
          retweets,
          replies,
          views,
          total: likes + retweets + replies,
        };

        totalLikes += likes;
        totalRetweets += retweets;
        totalReplies += replies;
        totalViews += views;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`⚠️ [ENGAGEMENT] Failed to fetch metrics for tweet ${tweetId}:`, error.message);
        metrics[tweetId] = {
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          total: 0,
          error: "Failed to fetch",
        };
      }
    }

    const totalEngagements = totalLikes + totalRetweets + totalReplies;

    console.log(`✅ [ENGAGEMENT] Fetched metrics for ${Object.keys(metrics).length} tweets`);
    console.log(`   Total: ${totalEngagements} engagements (${totalLikes} likes, ${totalRetweets} RTs, ${totalReplies} replies)`);

    return NextResponse.json({
      success: true,
      metrics,
      totals: {
        likes: totalLikes,
        retweets: totalRetweets,
        replies: totalReplies,
        views: totalViews,
        total: totalEngagements,
      },
    });
  } catch (error: any) {
    console.error("❌ [ENGAGEMENT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch engagement metrics",
        metrics: {},
        totals: {
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
          total: 0,
        },
      },
      { status: 500 }
    );
  }
});

