import { NextRequest, NextResponse } from "next/server";
import {
  autoPostTweet,
  autoPostReddit,
  autoPostMultiPlatform,
  checkUserConnections,
} from "@/lib/composio-automation";
import { withAuth } from "@/lib/api-auth";

/**
 * API Route: POST /api/composio/automate
 * Automates social media posts using Claude + Composio
 * 
 * SECURITY: Requires authentication - uses authenticated user ID
 * 
 * Body: {
 *   action: "tweet" | "reddit" | "multi",
 *   companyInfo: string,
 *   topic: string,
 *   subreddit?: string (required for reddit and multi)
 * }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { action, companyInfo, topic, subreddit } = body;

    // Use authenticated user ID (never trust userId from request body)
    const userId = user.id;

    // Validate input
    if (!action || !companyInfo || !topic) {
      return NextResponse.json(
        { error: "Missing required fields: action, companyInfo, topic" },
        { status: 400 }
      );
    }

    // Check user connections
    const connections = await checkUserConnections(userId);

    if (!connections.canAutomate) {
      return NextResponse.json(
        { error: "No active connections. Please connect Twitter or Reddit first." },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "tweet":
        if (!connections.hasTwitter) {
          return NextResponse.json(
            { error: "Twitter not connected" },
            { status: 400 }
          );
        }
        result = await autoPostTweet(userId, companyInfo, topic);
        break;

      case "reddit":
        if (!connections.hasReddit) {
          return NextResponse.json(
            { error: "Reddit not connected" },
            { status: 400 }
          );
        }
        if (!subreddit) {
          return NextResponse.json(
            { error: "subreddit is required for Reddit posts" },
            { status: 400 }
          );
        }
        result = await autoPostReddit(userId, subreddit, companyInfo, topic);
        break;

      case "multi":
        if (!connections.hasTwitter || !connections.hasReddit) {
          return NextResponse.json(
            { error: "Both Twitter and Reddit must be connected for multi-platform posting" },
            { status: 400 }
          );
        }
        if (!subreddit) {
          return NextResponse.json(
            { error: "subreddit is required for multi-platform posts" },
            { status: 400 }
          );
        }
        result = await autoPostMultiPlatform(
          userId,
          companyInfo,
          topic,
          subreddit
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be: tweet, reddit, or multi" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });
  } catch (error: any) {
    console.error("Error automating post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to automate post" },
      { status: 500 }
    );
  }
});

