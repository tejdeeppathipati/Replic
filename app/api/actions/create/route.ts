import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withAuth } from "@/lib/api-auth";
import { verifyBrandOwnership } from "@/lib/api-auth";

/**
 * API Route: POST /api/actions/create
 * Create a new content action
 *
 * SECURITY: Requires authentication and brand ownership verification
 */
export const POST = withAuth(async (request: NextRequest, user) => {
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

    // Validate required fields
    if (!brandId || !actionType || !title) {
      return NextResponse.json(
        { error: "brandId, actionType, and title are required" },
        { status: 400 }
      );
    }

    // Verify user owns this brand
    await verifyBrandOwnership(brandId, user.id);

    console.log(`📝 [CREATE ACTION] Creating action for brand: ${brandId} by user: ${user.id}`);

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

    // Use admin client so server-side insert bypasses client RLS.
    const supabase = createSupabaseAdminClient();

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

    const actionData = data as any;
    console.log(`✅ [CREATE ACTION] Created action: ${actionData?.id}`);

    return NextResponse.json({
      success: true,
      action: actionData,
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
});
