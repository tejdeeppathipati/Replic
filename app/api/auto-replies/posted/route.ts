import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: GET /api/auto-replies/posted?brandId=xxx&limit=50
 * Get posted replies for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

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
}

