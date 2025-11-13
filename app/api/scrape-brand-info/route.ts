import { NextRequest, NextResponse } from "next/server";
import { extractBrandInfoFromWebsite } from "@/lib/claude-scraper";
import { withAuth } from "@/lib/api-auth";

/**
 * POST /api/scrape-brand-info
 * Scrapes website and extracts brand information using Claude Haiku
 * 
 * SECURITY: Requires authentication
 *
 * Request body:
 * {
 *   "websiteUrl": "https://example.com"
 * }
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Parse request
    const body = await request.json();
    const { websiteUrl } = body;

    // Validate input
    if (!websiteUrl || typeof websiteUrl !== "string") {
      return NextResponse.json(
        { error: "websiteUrl is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    console.log(`[API] Received scrape request for: ${websiteUrl}`);

    // Extract brand info using Claude
    const brandInfo = await extractBrandInfoFromWebsite(websiteUrl);

    console.log(`[API] Successfully extracted brand info`);

    // Return extracted data
    return NextResponse.json(
      {
        success: true,
        data: brandInfo,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("[API] Error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
});
