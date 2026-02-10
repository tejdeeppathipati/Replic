import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { withBrandAuth } from "@/lib/api-auth";

/**
 * API Route: GET /api/auto-replies/posted?brandId=xxx&limit=50
 * Get posted replies for a brand
 */
export const GET = withBrandAuth(async (request: NextRequest, user, brandId) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    console.log(`✅ [AUTO-REPLIES POSTED] Fetching posted replies for brand: ${brandId} by user: ${user.id}`);

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("posted_replies")
      .select("*")
      .eq("brand_id", brandId)
      .order("posted_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching posted replies:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const repliesData = (data as any) || [];

    return NextResponse.json({
      success: true,
      replies: repliesData,
      count: repliesData.length,
    });
  } catch (error: any) {
    console.error("Error in posted endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch posted replies" },
      { status: 500 }
    );
  }
});
