import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * API Route: PUT /api/actions/update
 * Update an existing action
 */
export async function PUT(request: NextRequest) {
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

    console.log(`✏️ [UPDATE ACTION] Updating action: ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Build update object with only provided fields
    const updates: any = {};
    if (actionType !== undefined) updates.action_type = actionType;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (context !== undefined) updates.context = context;
    if (tone !== undefined) updates.tone = tone;
    if (status !== undefined) updates.status = status;

    // Update the action
    const { data, error } = await supabase
      .from("content_actions")
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
}

