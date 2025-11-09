import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: GET /api/auto-replies/queue?brandId=xxx
 * Get queued replies for a brand
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

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("reply_queue")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching reply queue:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const queueData = (data as any) || [];

    // Group by status
    const grouped = {
      queued: queueData.filter((r: any) => r.status === "queued") || [],
      posting: queueData.filter((r: any) => r.status === "posting") || [],
      posted: queueData.filter((r: any) => r.status === "posted") || [],
      failed: queueData.filter((r: any) => r.status === "failed") || [],
    };

    return NextResponse.json({
      success: true,
      replies: queueData,
      grouped,
      counts: {
        total: queueData.length,
        queued: grouped.queued.length,
        posting: grouped.posting.length,
        posted: grouped.posted.length,
        failed: grouped.failed.length,
      },
    });
  } catch (error: any) {
    console.error("Error in queue endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reply queue" },
      { status: 500 }
    );
  }
}

