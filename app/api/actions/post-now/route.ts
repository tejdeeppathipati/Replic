import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: POST /api/actions/post-now
 * Manually trigger immediate posting of a specific action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    console.log(`🚀 [POST ACTION NOW] Triggering action: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Get the action details
    const { data: action, error: fetchError } = await supabase
      .from("content_actions")
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

    if (action.status === "completed") {
      return NextResponse.json(
        { error: "Action already completed" },
        { status: 400 }
      );
    }

    console.log(`📤 [POST ACTION NOW] Calling daily-poster service...`);

    // Call daily-poster service to generate and post
    const dailyPosterUrl = process.env.DAILY_POSTER_URL || "http://localhost:8500";
    const response = await fetch(`${dailyPosterUrl}/post-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action_id: id,
        brand_id: action.brand_id,
        action_type: action.action_type,
        title: action.title,
        description: action.description,
        context: action.context,
        tone: action.tone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
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
}

