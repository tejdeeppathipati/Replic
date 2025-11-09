import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: GET /api/actions/list?brandId=xxx
 * List all actions for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId is required" },
        { status: 400 }
      );
    }

    console.log(`📋 [LIST ACTIONS] Fetching actions for brand: ${brandId}`);

    const supabase = createSupabaseClient();

    // Get all actions for this brand, ordered by creation date
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
}

