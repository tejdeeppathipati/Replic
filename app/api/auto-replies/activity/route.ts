import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withBrandAuth } from "@/lib/api-auth";

/**
 * API Route: GET /api/auto-replies/activity?brandId=xxx&limit=50
 * Get recent activity (monitored tweets, generated replies, posted replies)
 */
export const GET = withBrandAuth(async (request: NextRequest, user, brandId) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    console.log(`🧾 [AUTO-REPLIES ACTIVITY] Fetching activity for brand: ${brandId} by user: ${user.id}`);

    const supabase = createSupabaseAdminClient();

    // Get recent monitored tweets
    const { data: monitoredTweets } = await supabase
      .from("monitored_tweets")
      .select("id, tweet_text, author_username, trigger_type, status, relevance_score, created_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Get recent reply queue items
    const { data: queueItems } = await supabase
      .from("reply_queue")
      .select("id, reply_text, original_tweet_text, original_author, status, created_at, posted_at")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Get recent posted replies
    const { data: postedReplies } = await supabase
      .from("posted_replies")
      .select("id, reply_text, original_tweet_text, original_author, reply_tweet_id, posted_at, likes_count, retweets_count")
      .eq("brand_id", brandId)
      .order("posted_at", { ascending: false })
      .limit(limit);

    // Combine and sort by timestamp
    const activities: any[] = [];

    // Add monitored tweets
    const tweetsData = (monitoredTweets as any) || [];
    tweetsData.forEach((tweet: any) => {
      activities.push({
        type: "monitored",
        id: tweet.id,
        text: tweet.tweet_text,
        author: tweet.author_username,
        trigger: tweet.trigger_type,
        status: tweet.status,
        score: tweet.relevance_score,
        timestamp: tweet.created_at,
        icon: "🔍",
        label: `Tweet monitored (${tweet.trigger_type})`,
      });
    });

    // Add queue items
    const queueData = (queueItems as any) || [];
    queueData.forEach((item: any) => {
      activities.push({
        type: "queued",
        id: item.id,
        text: item.reply_text,
        original: item.original_tweet_text,
        author: item.original_author,
        status: item.status,
        timestamp: item.created_at,
        posted_at: item.posted_at,
        icon: item.status === "queued" ? "⏳" : item.status === "posting" ? "📤" : item.status === "posted" ? "✅" : "❌",
        label: `Reply ${item.status}`,
      });
    });

    // Add posted replies
    const repliesData = (postedReplies as any) || [];
    repliesData.forEach((reply: any) => {
      activities.push({
        type: "posted",
        id: reply.id,
        text: reply.reply_text,
        original: reply.original_tweet_text,
        author: reply.original_author,
        tweet_id: reply.reply_tweet_id,
        likes: reply.likes_count || 0,
        retweets: reply.retweets_count || 0,
        timestamp: reply.posted_at,
        icon: "✅",
        label: "Reply posted",
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, limit),
      counts: {
        monitored: tweetsData.length,
        queued: queueData.length,
        posted: repliesData.length,
      },
    });
  } catch (error: any) {
    console.error("Error in activity endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity" },
      { status: 500 }
    );
  }
});
