import { NextRequest, NextResponse } from "next/server";
import { storeBrandQAEmbeddings } from "@/lib/qa-embeddings";
import { withAuth, verifyBrandOwnership } from "@/lib/api-auth";

/**
 * POST /api/embeddings/store-qa
 *
 * Stores embeddings for brand Q&A responses
 * Called when the user completes onboarding
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    const {
      brandAgentId,
      qaResponseId,
      brandSummary,
      brandVoice,
      keyInsights,
      coreValuesMission,
      questions,
    } = body;

    // Validate required fields
    if (!brandAgentId || !qaResponseId || !questions) {
      return NextResponse.json(
        {
          error: "Missing required fields: brandAgentId, qaResponseId, questions",
        },
        { status: 400 }
      );
    }

    // Verify the brand belongs to the authenticated user (never trust userId from the body).
    try {
      await verifyBrandOwnership(brandAgentId, user.id);
    } catch {
      return NextResponse.json(
        { error: "You do not have access to this brand" },
        { status: 403 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "questions must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each question has question and answer
    for (const qa of questions) {
      if (!qa.question || !qa.answer) {
        return NextResponse.json(
          { error: "Each question object must have 'question' and 'answer' fields" },
          { status: 400 }
        );
      }
    }

    console.log(`Storing embeddings for brand agent: ${brandAgentId}`);

    // Store the embeddings
    const embeddingIds = await storeBrandQAEmbeddings({
      brandAgentId,
      userId: user.id,
      qaResponseId,
      brandSummary,
      brandVoice,
      keyInsights,
      coreValuesMission,
      questions,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully stored ${embeddingIds.length} embeddings`,
        embeddingIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in store-qa endpoint:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to store embeddings";

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
});
