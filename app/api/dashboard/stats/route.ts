import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: GET /api/dashboard/stats?brandId=xxx
 * Get dashboard statistics for a brand
 * 
 * Returns:
 * - Total engagements (from engagement metrics)
 * - Queued posts (pending actions)
 * - Success rate (posted / total)
 * - Recent posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    console.log(`📊 [DASHBOARD STATS] Fetching stats for brand: ${brandId}`);

    const supabase = createSupabaseClient();

    // 1. Get pending actions count
    const { count: pendingCount } = await supabase
      .from("content_actions")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "pending");

    // 2. Get completed actions count
    const { count: completedCount } = await supabase
      .from("content_actions")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "completed");

    // 3. Get paused actions count
    const { count: pausedCount } = await supabase
      .from("content_actions")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "paused");

    // 4. Get total posts from daily_content
    const { count: dailyPostsCount } = await supabase
      .from("daily_content")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "posted");

    // 5. Get failed posts count
    const { count: failedPostsCount } = await supabase
      .from("daily_content")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "failed");

    // 6. Calculate success rate
    const totalAttempted = (completedCount || 0) + (failedPostsCount || 0);
    const successRate = totalAttempted > 0 
      ? Math.round(((completedCount || 0) / totalAttempted) * 100)
      : null;

    // 7. Get recent posts (from both tables)
    // From content_actions (completed actions)
    const { data: recentActions } = await supabase
      .from("content_actions")
      .select("id, title, post_text, tweet_id, tweet_url, posted_at, action_type, created_at")
      .eq("brand_id", brandId)
      .eq("status", "completed")
      .order("posted_at", { ascending: false })
      .limit(10);

    // From daily_content (all posts)
    const { data: recentDailyPosts } = await supabase
      .from("daily_content")
      .select("id, content, tweet_id, created_at, status")
      .eq("brand_id", brandId)
      .eq("status", "posted")
      .order("created_at", { ascending: false })
      .limit(10);

    // Combine and sort by date
    const actionsData = (recentActions as any) || [];
    const dailyPostsData = (recentDailyPosts as any) || [];
    
    const allRecentPosts = [
      ...actionsData.map((action: any) => ({
        id: action.id,
        text: action.post_text || action.title,
        tweet_id: action.tweet_id,
        tweet_url: action.tweet_url,
        posted_at: action.posted_at || action.created_at,
        source: "action",
        action_type: action.action_type,
      })),
      ...dailyPostsData.map((post: any) => ({
        id: post.id,
        text: post.content,
        tweet_id: post.tweet_id,
        tweet_url: post.tweet_id ? `https://x.com/i/web/status/${post.tweet_id}` : null,
        posted_at: post.created_at,
        source: "daily",
        action_type: null,
      })),
    ]
      .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
      .slice(0, 10);

    // 8. Get tweet IDs for engagement fetching
    const tweetIds = allRecentPosts
      .map((post) => post.tweet_id)
      .filter((id): id is string => id !== null && id !== undefined);

    console.log(`✅ [DASHBOARD STATS] Found:`);
    console.log(`   - Pending actions: ${pendingCount || 0}`);
    console.log(`   - Completed actions: ${completedCount || 0}`);
    console.log(`   - Daily posts: ${dailyPostsCount || 0}`);
    console.log(`   - Recent posts: ${allRecentPosts.length}`);
    console.log(`   - Tweet IDs for engagement: ${tweetIds.length}`);

    return NextResponse.json({
      success: true,
      stats: {
        pendingActions: pendingCount || 0,
        completedActions: completedCount || 0,
        pausedActions: pausedCount || 0,
        totalPosts: (completedCount || 0) + (dailyPostsCount || 0),
        failedPosts: failedPostsCount || 0,
        successRate: successRate,
        queuedPosts: pendingCount || 0, // Same as pendingActions
      },
      recentPosts: allRecentPosts,
      tweetIds: tweetIds, // For fetching engagement metrics
    });
  } catch (error: any) {
    console.error("❌ [DASHBOARD STATS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}

