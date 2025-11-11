import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { withAuth } from "@/lib/api-auth";

/**
 * API Route: DELETE /api/actions/delete
 * Delete an action
 *
 * SECURITY: Requires authentication and brand ownership verification
 */
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // First, verify the action belongs to a brand owned by this user
    const { data: existingAction, error: fetchError } = await (supabase
      .from("content_actions") as any)
      .select("brand_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingAction) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Verify brand ownership
    const { data: brand, error: brandError } = await (supabase
      .from("brand_agent") as any)
      .select("id")
      .eq("id", existingAction.brand_id)
      .eq("user_id", user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "You do not have access to this action" },
        { status: 403 }
      );
    }

    console.log(`🗑️ [DELETE ACTION] Deleting action: ${id} by user: ${user.id}`);

    // Delete the action
    const { error } = await (supabase
      .from("content_actions") as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ [DELETE ACTION] Database error:", error);
      throw error;
    }

    console.log(`✅ [DELETE ACTION] Deleted action: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Action deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ [DELETE ACTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete action",
      },
      { status: 500 }
    );
  }
});

