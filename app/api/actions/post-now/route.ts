import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withAuth } from "@/lib/api-auth";
import { verifyBrandOwnership } from "@/lib/api-auth";

/**
 * API Route: POST /api/actions/post-now
 * Manually trigger immediate posting of a specific action
 *
 * SECURITY: Requires authentication and brand ownership verification
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Get the action details
    const { data: action, error: fetchError } = await (supabase
      .from("content_actions") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !action) {
      console.error("❌ [POST ACTION NOW] Action not found:", id);
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    const actionData = action as any;

    // Verify brand ownership
    try {
      await verifyBrandOwnership(actionData.brand_id, user.id);
    } catch (error) {
      return NextResponse.json(
        { error: "You do not have access to this action" },
        { status: 403 }
      );
    }

    console.log(`🚀 [POST ACTION NOW] Triggering action: ${id} by user: ${user.id}`);
    if (actionData.status === "completed") {
      return NextResponse.json(
        { error: "Action already completed" },
        { status: 400 }
      );
    }

    console.log(`📤 [POST ACTION NOW] Calling daily-poster service...`);

    // Call daily-poster service to generate and post
    const dailyPosterUrl = process.env.DAILY_POSTER_URL || "http://localhost:8500";

    let response;
    try {
      response = await fetch(`${dailyPosterUrl}/post-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action_id: id,
          brand_id: actionData.brand_id,
          action_type: actionData.action_type,
          title: actionData.title,
          description: actionData.description,
          context: actionData.context,
          tone: actionData.tone,
        }),
      });
    } catch (fetchError: any) {
      console.error(`❌ [POST ACTION NOW] Failed to connect to daily-poster service at ${dailyPosterUrl}`);
      console.error(`   Error: ${fetchError.message}`);

      // Check if it's a connection error
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Daily-poster service is not running at ${dailyPosterUrl}. ` +
          `Please ensure the daily-poster service is running and accessible.`
        );
      }
      throw new Error(`Failed to reach daily-poster service: ${fetchError.message}`);
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.detail || "Failed to post action");
    }

    const result = await response.json();

    console.log(`✅ [POST ACTION NOW] Action posted successfully`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ [POST ACTION NOW] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to post action",
      },
      { status: 500 }
    );
  }
});

