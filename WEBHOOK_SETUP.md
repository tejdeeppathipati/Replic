# 🪝 Composio Webhook Setup Guide

## What This Does

When a user completes OAuth authentication with Twitter or Reddit, Composio will automatically notify your app via webhook. Your integrations page will then **auto-refresh** and show the new connection **without manual page refresh**!

## 🚀 Quick Setup

### Step 1: Expose Your Local Server (Development)

Since Composio needs to send webhooks to your server, you need to expose your localhost to the internet.

**Using ngrok (Recommended):**

1. Install ngrok:
   ```bash
   brew install ngrok  # Mac
   # or download from: https://ngrok.com/download
   ```

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. You'll get a URL like:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
   ```

4. Copy that HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 2: Configure Webhook in Composio Dashboard

1. Go to: https://platform.composio.dev/settings/webhooks

2. Click **"Add Webhook"**

3. Fill in:
   - **Webhook URL**: `https://abc123.ngrok.io/api/composio/webhook` 
     (replace with your ngrok URL)
   - **Events to listen**: Select these:
     - ✅ `connection.created`
     - ✅ `connection.active`
     - ✅ `connection.failed` (optional)

4. Click **"Save"**

### Step 3: Test It!

1. Make sure your dev server is running:
   ```bash
   npm run dev
   ```

2. Make sure ngrok is running in another terminal

3. Go to: `http://localhost:3000/dashboard/integrations`

4. Click **"Connect"** on Twitter or Reddit

5. Complete OAuth authorization

6. **Watch the magic!** ✨
   - Page will auto-refresh
   - Green dot will appear
   - Username will show up
   - All without manual refresh!

---

## 📱 How It Works

```
User clicks Connect
     ↓
OAuth flow starts
     ↓
User authorizes on Twitter/Reddit
     ↓
Composio establishes connection
     ↓
Composio sends webhook to your server ← NEW!
     ↓
Your webhook endpoint receives event
     ↓
Frontend polls for updates (every 3 seconds)
     ↓
Detects new connection
     ↓
Automatically refreshes connection list
     ↓
✅ Green dot appears + username shows!
```

---

## 🔍 Debugging

### Check if webhook is receiving events

Watch your terminal where `npm run dev` is running. When a connection is made, you should see:

```
📥 Webhook received: {
  "event": "connection.active",
  "payload": {
    "connectedAccountId": "ca_xyz123",
    "integrationId": "reddit",
    "clientUniqueUserId": "default",
    "status": "ACTIVE"
  }
}
✅ Connection ACTIVE for user: default, integration: reddit
```

### Test webhook manually

You can test your webhook endpoint:

```bash
curl -X POST http://localhost:3000/api/composio/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "connection.active",
    "payload": {
      "connectedAccountId": "test_123",
      "integrationId": "reddit",
      "clientUniqueUserId": "default",
      "status": "ACTIVE"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

Should respond with:
```json
{
  "received": true,
  "event": "connection.active",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🌐 Production Setup

For production, instead of ngrok:

1. Deploy your Next.js app (Vercel, Railway, etc.)
2. Use your production URL in Composio webhook settings:
   ```
   https://your-domain.com/api/composio/webhook
   ```
3. Update `.env` or `.env.production`:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

---

## ⚡ Advanced: Webhook Security (Optional)

To verify webhooks are actually from Composio:

1. **Add webhook secret** in Composio dashboard
2. **Verify signature** in your webhook endpoint:

```typescript
// app/api/composio/webhook/route.ts
import crypto from "crypto";

export async function POST(request: NextRequest) {
  // Get signature from headers
  const signature = request.headers.get("x-composio-signature");
  const secret = process.env.COMPOSIO_WEBHOOK_SECRET;
  
  // Verify signature
  const body = await request.text();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
    
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  // Process webhook...
}
```

---

## 🎯 Benefits

✅ **Auto-updates**: No manual refresh needed  
✅ **Better UX**: Immediate feedback when connection succeeds  
✅ **Real-time**: Updates appear within 3 seconds  
✅ **No page reload**: Smooth experience  

---

## 📝 Optional Improvements

### Use WebSockets instead of polling
For even more real-time updates, you could use WebSockets or Server-Sent Events (SSE) instead of polling every 3 seconds.

### Use Redis for webhook events
In production, store webhook events in Redis instead of in-memory:

```typescript
import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

// Store event
await redis.setex(`webhook:${userId}`, 60, JSON.stringify(event));

// Read event
const event = await redis.get(`webhook:${userId}`);
```

---

## ❓ Troubleshooting

**Webhook not firing?**
- Check ngrok is running and accessible
- Verify webhook URL in Composio dashboard is correct
- Check terminal logs for incoming webhook requests

**Page not auto-updating?**
- Check browser console for errors
- Verify polling is working (should see network requests every 3s)
- Try manual refresh to confirm connection exists

**Still stuck?**
- Check Composio dashboard → Webhooks → Delivery History
- Look for failed webhook attempts
- Verify your server is accessible from internet

---

Need help? The webhook endpoint is already set up and ready to receive events from Composio! Just follow Step 1 & 2 above to configure it.

