import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withBrandAuth } from "@/lib/api-auth";

/**
 * API Route: GET /api/actions/list?brandId=xxx
 * List all actions for a brand
 *
 * SECURITY: Requires authentication and brand ownership verification
 */
export const GET = withBrandAuth(async (request: NextRequest, user, brandId) => {
  try {
    console.log(`📋 [LIST ACTIONS] Fetching actions for brand: ${brandId} by user: ${user.id}`);

    const supabase = createSupabaseAdminClient();

    // Get all actions for this brand, ordered by creation date
    // Note: The withBrandAuth wrapper already verified that this user owns this brand
    const { data, error } = await supabase
      .from("content_actions")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [LIST ACTIONS] Database error:", error);
      throw error;
    }

    const actionsData = (data as any) || [];
    console.log(`✅ [LIST ACTIONS] Found ${actionsData.length} actions`);

    // Group by status
    const pending = actionsData.filter((a: any) => a.status === "pending") || [];
    const completed = actionsData.filter((a: any) => a.status === "completed") || [];
    const paused = actionsData.filter((a: any) => a.status === "paused") || [];

    return NextResponse.json({
      success: true,
      actions: actionsData,
      grouped: {
        pending,
        completed,
        paused,
      },
      stats: {
        total: actionsData.length,
        pending: pending.length,
        completed: completed.length,
        paused: paused.length,
      },
    });
  } catch (error: any) {
    console.error("❌ [LIST ACTIONS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to list actions",
      },
      { status: 500 }
    );
  }
});

