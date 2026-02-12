import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withBrandAuth } from "@/lib/api-auth";

/**
 * API Route: GET /api/auto-replies/stats?brandId=xxx
 * Get auto-reply statistics for a brand
 */
export const GET = withBrandAuth(async (request: NextRequest, user, brandId) => {
  try {
    console.log(`📈 [AUTO-REPLIES STATS] Fetching stats for brand: ${brandId} by user: ${user.id}`);

    // Use admin client after ownership verification to avoid relying on RLS configuration.
    const supabase = createSupabaseAdminClient();

    // Get counts from reply_queue
    const { count: queuedCount } = await supabase
      .from("reply_queue")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "queued");

    const { count: postedCount } = await supabase
      .from("reply_queue")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "posted");

    const { count: failedCount } = await supabase
      .from("reply_queue")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "failed");

    // Get counts from posted_replies
    const { count: totalPostedCount } = await supabase
      .from("posted_replies")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);

    // Get monitored tweets counts
    const { count: monitoredCount } = await supabase
      .from("monitored_tweets")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);

    const { count: relevantCount } = await supabase
      .from("monitored_tweets")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .eq("status", "replied");

    // Get engagement totals from posted_replies
    const { data: engagementData } = await supabase
      .from("posted_replies")
      .select("likes_count, retweets_count, replies_count, views_count")
      .eq("brand_id", brandId);

    const engagementArray = (engagementData as any) || [];
    const totalEngagement = {
      likes: engagementArray.reduce((sum: number, r: any) => sum + (r.likes_count || 0), 0) || 0,
      retweets: engagementArray.reduce((sum: number, r: any) => sum + (r.retweets_count || 0), 0) || 0,
      replies: engagementArray.reduce((sum: number, r: any) => sum + (r.replies_count || 0), 0) || 0,
      views: engagementArray.reduce((sum: number, r: any) => sum + (r.views_count || 0), 0) || 0,
    };

    // Calculate success rate
    const totalAttempted = (postedCount || 0) + (failedCount || 0);
    const successRate = totalAttempted > 0
      ? Math.round(((postedCount || 0) / totalAttempted) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        queued: queuedCount || 0,
        posted: postedCount || 0,
        failed: failedCount || 0,
        totalPosted: totalPostedCount || 0,
        monitored: monitoredCount || 0,
        relevant: relevantCount || 0,
        successRate,
        engagement: totalEngagement,
      },
    });
  } catch (error: any) {
    console.error("Error in stats endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch auto-reply stats" },
      { status: 500 }
    );
  }
});
