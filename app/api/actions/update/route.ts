import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { withAuth } from "@/lib/api-auth";

/**
 * API Route: PUT /api/actions/update
 * Update an existing action
 *
 * SECURITY: Requires authentication and brand ownership verification
 */
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const {
      id,
      actionType,
      title,
      description,
      context,
      tone,
      status,
    } = body;

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

    console.log(`✏️ [UPDATE ACTION] Updating action: ${id} by user: ${user.id}`);

    // Build update object with only provided fields
    const updates: any = {};
    if (actionType !== undefined) updates.action_type = actionType;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (context !== undefined) updates.context = context;
    if (tone !== undefined) updates.tone = tone;
    if (status !== undefined) updates.status = status;

    // Update the action
    const { data, error } = await (supabase
      .from("content_actions") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [UPDATE ACTION] Database error:", error);
      throw error;
    }

    const actionData = data as any;
    console.log(`✅ [UPDATE ACTION] Updated action: ${id}`);

    return NextResponse.json({
      success: true,
      action: actionData,
    });
  } catch (error: any) {
    console.error("❌ [UPDATE ACTION] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update action",
      },
      { status: 500 }
    );
  }
});

