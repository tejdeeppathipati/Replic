import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyBrandOwnership } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

/**
 * API Route: POST /api/auto-replies/post-reply
 * Post a specific reply to a tweet
 * 
 * Body: { brandId: string, tweetId: string, replyText: string }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { brandId, tweetId, replyText } = body;

    if (!brandId || !tweetId || !replyText) {
      return NextResponse.json(
        { error: "brandId, tweetId, and replyText are required" },
        { status: 400 }
      );
    }

    // Verify brand ownership
    try {
      await verifyBrandOwnership(brandId, user.id);
    } catch {
      return NextResponse.json(
        { error: "You do not have access to this brand" },
        { status: 403 }
      );
    }

    const autoReplierUrl = process.env.AUTO_REPLIER_URL || "http://localhost:8600";
    
    // Get original tweet info for context
    const supabase = createSupabaseAdminClient();
    
    const { data: tweetData } = await supabase
      .from("monitored_tweets")
      .select("tweet_text, author_username")
      .eq("tweet_id", tweetId)
      .eq("brand_id", brandId)
      .single();
    
    const tweet = (tweetData as any) || null;
    
    // Post the reply via auto-replier service
    const response = await fetch(`${autoReplierUrl}/post-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_id: brandId,
        tweet_id: tweetId,
        reply_text: replyText,
        original_tweet_text: tweet?.tweet_text || "",
        original_author: tweet?.author_username || "",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to post reply");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
    });

  } catch (error: any) {
    console.error("Error posting reply:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to post reply",
      },
      { status: 500 }
    );
  }
});
