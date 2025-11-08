import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Composio Webhook Endpoint
 * 
 * This endpoint receives webhook events from Composio when:
 * - A connection is established (ACTIVE)
 * - A connection fails (FAILED)
 * - A connection is initiated (INITIATED)
 * 
 * Configure this webhook in your Composio dashboard:
 * https://platform.composio.dev/settings/webhooks
 * 
 * Webhook URL: https://your-domain.com/api/composio/webhook
 */

// Store recent connection events in memory (for development)
// In production, use Redis, Database, or other persistent storage
const recentEvents = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.COMPOSIO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-composio-signature") || 
                       request.headers.get("x-webhook-signature");
      
      if (signature) {
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(rawBody)
          .digest("hex");
        
        if (signature !== expectedSignature && signature !== `sha256=${expectedSignature}`) {
          console.error("❌ Invalid webhook signature");
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
          );
        }
        console.log("✅ Webhook signature verified");
      }
    }
    
    console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

    // Composio webhook payload structure
    const {
      event,
      payload,
      timestamp,
    } = body;

    // Handle connection events
    if (event === "connection.created" || event === "connection.active") {
      const {
        connectedAccountId,
        integrationId,
        clientUniqueUserId, // This is the userId we passed
        status,
      } = payload;

      // Store the event for this user
      recentEvents.set(clientUniqueUserId, {
        connectedAccountId,
        integrationId,
        status,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Connection ${status} for user: ${clientUniqueUserId}, integration: ${integrationId}`);

      // Clean up old events (keep only last 1000)
      if (recentEvents.size > 1000) {
        const firstKey = recentEvents.keys().next().value;
        recentEvents.delete(firstKey);
      }
    }

    // Acknowledge webhook receipt
    return NextResponse.json({ 
      received: true,
      event,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check for recent events (used by frontend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const event = recentEvents.get(userId);
    
    if (event) {
      // Clear the event after reading
      recentEvents.delete(userId);
      return NextResponse.json({ 
        hasUpdate: true,
        event,
      });
    }

    return NextResponse.json({ 
      hasUpdate: false,
    });

  } catch (error: any) {
    console.error("Error checking webhook events:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

