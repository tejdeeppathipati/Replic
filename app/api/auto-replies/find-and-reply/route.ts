import { NextRequest, NextResponse } from "next/server";
import { withAuth, verifyBrandOwnership } from "@/lib/api-auth";

/**
 * API Route: POST /api/auto-replies/find-and-reply
 * Find best tweet to reply to, generate reply, and post it
 * 
 * SECURITY: Requires authentication and brand ownership verification
 * 
 * Body: { brandId: string }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
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

    console.log(`🔍 [FIND & REPLY] Starting for brand: ${brandId}`);

    // Call auto-replier service
    const autoReplierUrl = process.env.AUTO_REPLIER_URL || "http://localhost:8600";
    
    // Step 1: Monitor (find tweets)
    console.log("   Step 1: Monitoring tweets...");
    const monitorRes = await fetch(`${autoReplierUrl}/monitor/${brandId}`, {
      method: "POST",
    });
    
    if (!monitorRes.ok) {
      let errorMessage = monitorRes.statusText;
      try {
        const errorData = await monitorRes.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
      }
      console.error("   ❌ Monitoring failed:", errorMessage);
      
      // Provide user-friendly error messages
      if (monitorRes.status === 503) {
        throw new Error(`Service configuration error: ${errorMessage}. Please check your environment variables.`);
      } else if (monitorRes.status === 404) {
        throw new Error(`Brand not found: ${errorMessage}`);
      } else {
        throw new Error(`Monitoring failed: ${errorMessage}`);
      }
    }
    
    const monitorData = await monitorRes.json();
    console.log(`   ✅ Found ${monitorData.tweets_found || monitorData.total_fetched || 0} tweets`);

    // Step 2: Score tweets (rank by relevance)
    console.log("   Step 2: Scoring tweets...");
    const scoreRes = await fetch(`${autoReplierUrl}/score/${brandId}`, {
      method: "POST",
    });
    
    if (!scoreRes.ok) {
      throw new Error(`Scoring failed: ${scoreRes.statusText}`);
    }
    
    const scoreData = await scoreRes.json();
    console.log(`   ✅ Scored ${scoreData.tweets_scored || 0} tweets`);

    // Step 3: Get the best tweet (highest relevance score) from database
    console.log("   Step 3: Finding best tweet...");
    const { createSupabaseClient } = await import("@/lib/supabase");
    const supabase = createSupabaseClient();
    
    const { data: bestTweets, error: tweetError } = await supabase
      .from("monitored_tweets")
      .select("*")
      .eq("brand_id", brandId)
      .eq("status", "replied")
      .order("relevance_score", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (tweetError || !bestTweets) {
      return NextResponse.json({
        success: false,
        error: "No suitable tweets found to reply to",
        message: "Try again in a few minutes or check your keywords/hashtags. Make sure monitoring and scoring have run.",
      });
    }

    const tweetData = bestTweets as any;

    // Step 4: Generate reply for best tweet
    console.log("   Step 4: Generating reply...");
    const generateRes = await fetch(`${autoReplierUrl}/generate-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_id: brandId,
        tweet_id: tweetData.tweet_id,
        tweet_text: tweetData.tweet_text,
        author_username: tweetData.author_username,
      }),
    });

    if (!generateRes.ok) {
      const errorData = await generateRes.json().catch(() => ({}));
      throw new Error(errorData.detail || `Reply generation failed: ${generateRes.statusText}`);
    }

    const generateData = await generateRes.json();
    console.log("   ✅ Reply generated");

    // Return preview (don't post automatically - user will confirm)
    return NextResponse.json({
      success: true,
      tweet: {
        id: tweetData.tweet_id,
        text: tweetData.tweet_text,
        author: tweetData.author_username,
        score: tweetData.relevance_score,
        trigger: tweetData.trigger_type,
        sentiment: tweetData.sentiment,
      },
      reply: {
        text: generateData.generated_reply?.reply_text || "Reply generated",
        tone: generateData.generated_reply?.reply_tone,
        type: generateData.generated_reply?.reply_type,
      },
      posted: false, // Not posted yet - waiting for confirmation
      message: "Reply generated! Review and confirm to send.",
    });

  } catch (error: any) {
    console.error("❌ [FIND & REPLY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to find and reply",
      },
      { status: 500 }
    );
  }
});

