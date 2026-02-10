import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { composioClient, getUserConnections, getUserTools } from "@/lib/composio-client";

function requireInternalAuth(request: NextRequest): string | null {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  const auth = request.headers.get("Authorization") || "";
  if (!expected) return "INTERNAL_SERVICE_SECRET is not set";
  if (auth !== `Bearer ${expected}`) return "Unauthorized";
  return null;
}

async function getBrandOwnerUserId(brandId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("brand_agent")
    .select("id,user_id")
    .eq("id", brandId)
    .single();

  if (error || !data?.user_id) {
    throw new Error("Brand not found");
  }

  return data.user_id as string;
}

async function enforcePostgresRateLimit(
  brandId: string,
  bucket: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; note?: string }> {
  const supabase = createSupabaseAdminClient();
  try {
    const { data, error } = await (supabase as any).rpc("replic_check_rate_limit", {
      p_brand_id: brandId,
      p_bucket: bucket,
      p_limit: limit,
      p_window_sec: windowSec,
    });

    if (error) {
      return { allowed: true, note: `rate_limit_skipped:${error.message}` };
    }

    if (data === false) {
      return { allowed: false };
    }

    return { allowed: true };
  } catch (e: any) {
    return { allowed: true, note: `rate_limit_skipped:${e?.message || String(e)}` };
  }
}

function isActiveConn(conn: any) {
  return conn?.status === "ACTIVE";
}

function connMatches(conn: any, keywords: string[]) {
  const integration = String(conn?.integration || "").toLowerCase();
  const slug = String(conn?.integrationSlug || "").toLowerCase();
  const appName = String(conn?.appName || "").toLowerCase();
  const appUniqueId = String(conn?.appUniqueId || "").toLowerCase();
  const integrationId = String(conn?.integrationId || "").toLowerCase();
  const haystack = [integration, slug, appName, appUniqueId, integrationId].join(" ");
  return keywords.some((k) => haystack.includes(k));
}

async function findConnectedAccountId(userId: string, keywords: string[]) {
  const connections = await getUserConnections(userId);
  const active = connections.find((c: any) => isActiveConn(c) && connMatches(c, keywords));
  return active?.id as string | undefined;
}

async function findToolName(userId: string, toolkits: string[], candidates: string[], fallback: (name: string) => boolean) {
  const tools = await getUserTools(userId, toolkits);
  const names = tools.map((t: any) => t.function?.name || t.name || "");
  const exact = tools.find((t: any) => candidates.includes((t.function?.name || t.name || "").toUpperCase()));
  if (exact) return (exact as any).function?.name || (exact as any).name;
  const fb = tools.find((t: any) => fallback(String((t.function?.name || t.name || "")).toLowerCase()));
  if (fb) return (fb as any).function?.name || (fb as any).name;
  throw new Error(`Posting tool not found. Available: ${names.filter(Boolean).slice(0, 15).join(", ")}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const authError = requireInternalAuth(request);
  if (authError) {
    return NextResponse.json({ success: false, error: authError }, { status: authError === "Unauthorized" ? 401 : 500 });
  }

  const { action } = await params;
  const body = await request.json().catch(() => ({}));
  const brandId = body.brandId as string | undefined;

  if (!brandId) {
    return NextResponse.json({ success: false, error: "brandId is required" }, { status: 400 });
  }

  let userId: string;
  try {
    userId = await getBrandOwnerUserId(brandId);
  } catch {
    return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
  }

  try {
    if (action === "post-tweet") {
      const text = String(body.text || "");
      if (!text) return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });
      if (text.length > 280) return NextResponse.json({ success: false, error: "Tweet must be 280 characters or less" }, { status: 400 });

      const rate = await enforcePostgresRateLimit(brandId, "composio:post:x", 10, 3600);
      if (!rate.allowed) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded for X posting" }, { status: 429 });
      }

      const connectedAccountId = await findConnectedAccountId(userId, ["twitter", "x"]);
      if (!connectedAccountId) {
        return NextResponse.json({ success: false, error: "X/Twitter not connected for this brand owner" }, { status: 400 });
      }

      const toolName = await findToolName(
        userId,
        ["TWITTER"],
        ["TWITTER_CREATION_OF_A_POST", "TWITTER_POST_TWEET", "TWITTER_CREATE_TWEET"],
        (name) => (name.includes("twitter") || name.includes("x")) && name.includes("post") && !name.includes("delete")
      );

      const result = await composioClient.tools.execute(toolName, {
        userId,
        connectedAccountId,
        arguments: { text },
      });

      const tweetData = (result as any).data || result;
      const tweetId = tweetData.id || tweetData.tweet_id || tweetData.id_str;
      const url = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : null;

      return NextResponse.json({ success: true, tweetId, url, fullResult: tweetData, rateLimitNote: rate.note });
    }

    if (action === "post-reddit") {
      const subreddit = String(body.subreddit || "");
      const title = String(body.title || "");
      const kind = String(body.kind || "");
      const text = body.text ? String(body.text) : undefined;
      const url = body.url ? String(body.url) : undefined;
      const flair_id = body.flair_id ? String(body.flair_id) : undefined;

      if (!subreddit || !title || !kind) {
        return NextResponse.json({ success: false, error: "subreddit, title, and kind are required" }, { status: 400 });
      }
      if (kind === "self" && !text) {
        return NextResponse.json({ success: false, error: "text is required for self posts" }, { status: 400 });
      }
      if (kind === "link" && !url) {
        return NextResponse.json({ success: false, error: "url is required for link posts" }, { status: 400 });
      }

      const rate = await enforcePostgresRateLimit(brandId, "composio:post:reddit", 5, 3600);
      if (!rate.allowed) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded for Reddit posting" }, { status: 429 });
      }

      const connectedAccountId = await findConnectedAccountId(userId, ["reddit"]);
      if (!connectedAccountId) {
        return NextResponse.json({ success: false, error: "Reddit not connected for this brand owner" }, { status: 400 });
      }

      const toolName = await findToolName(
        userId,
        ["REDDIT"],
        ["REDDIT_CREATE_REDDIT_POST", "REDDIT_CREATE_A_REDDIT_POST", "REDDIT_CREATE_POST"],
        (name) => name.includes("reddit") && name.includes("create") && name.includes("post") && !name.includes("delete")
      );

      const params = { subreddit, title, kind, flair_id: flair_id || "", ...(kind === "self" ? { text } : { url }) };

      const result = await composioClient.tools.execute(toolName, {
        userId,
        connectedAccountId,
        arguments: params,
      });

      const postData = (result as any).data || result;
      const postId = postData.id || postData.name;
      const postUrl = postData.url || (postId ? `https://reddit.com/comments/${postId}` : null);

      return NextResponse.json({ success: true, postId, url: postUrl, fullResult: postData, rateLimitNote: rate.note });
    }

    if (action === "post-linkedin") {
      const text = String(body.text || "");
      if (!text) return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });

      const rate = await enforcePostgresRateLimit(brandId, "composio:post:linkedin", 5, 3600);
      if (!rate.allowed) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded for LinkedIn posting" }, { status: 429 });
      }

      const connectedAccountId = await findConnectedAccountId(userId, ["linkedin"]);
      if (!connectedAccountId) {
        return NextResponse.json({ success: false, error: "LinkedIn not connected for this brand owner" }, { status: 400 });
      }

      const toolName = await findToolName(
        userId,
        ["LINKEDIN"],
        ["LINKEDIN_CREATE_POST", "LINKEDIN_CREATE_A_POST", "LINKEDIN_CREATE_LINKEDIN_POST"],
        (name) => name.includes("linkedin") && name.includes("create") && (name.includes("post") || name.includes("share"))
      );

      const result = await composioClient.tools.execute(toolName, {
        userId,
        connectedAccountId,
        arguments: { text },
      });

      const postData = (result as any).data || result;
      return NextResponse.json({ success: true, fullResult: postData, rateLimitNote: rate.note });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal error", details: String(error) },
      { status: 500 }
    );
  }
}
