import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: POST /api/actions/create
 * Create a new content action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      actionType,
      title,
      description,
      context,
      tone = "engaging",
    } = body;

    console.log(`📝 [CREATE ACTION] Creating action for brand: ${brandId}`);

    // Validate required fields
    if (!brandId || !actionType || !title) {
      return NextResponse.json(
        { error: "brandId, actionType, and title are required" },
        { status: 400 }
      );
    }

    // Validate action type
    const validTypes = [
      "announcement",
      "engagement",
      "excitement",
      "promotion",
      "education",
      "community",
      "metrics",
    ];
    if (!validTypes.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid action type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Create the action
    const { data, error } = await supabase
      .from("content_actions")
      .insert({
        brand_id: brandId,
        action_type: actionType,
        title,
        description,
        context,
        tone,
        status: "pending",
      } as any)
      .select()
      .single();

    if (error) {
      console.error("❌ [CREATE ACTION] Database error:", error);
      throw error;
    }

    console.log(`✅ [CREATE ACTION] Created action: ${data.id}`);

    return NextResponse.json({
      success: true,
      action: data,
    });
  } catch (error: any) {
    console.error("❌ [CREATE ACTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create action",
      },
      { status: 500 }
    );
  }
}

