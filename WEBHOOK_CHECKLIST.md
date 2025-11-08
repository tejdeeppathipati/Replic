# ✅ Webhook Setup Checklist

Use this to verify your webhook is set up correctly!

---

## 📋 Step-by-Step Verification

### ✅ 1. Environment Variables

Check your `.env` file has:

```env
COMPOSIO_API_KEY=comp_xxxxx
TWITTER_AUTH_CONFIG_ID=ac_xxxxx
REDDIT_AUTH_CONFIG_ID=ac_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
COMPOSIO_WEBHOOK_SECRET=your_webhook_secret_from_composio
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Important:** The variable must be named exactly `COMPOSIO_WEBHOOK_SECRET`

---

### ✅ 2. ngrok Running

Make sure ngrok is running:

```bash
ngrok http 3000
```

You should see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy your ngrok URL!** (e.g., `https://abc123.ngrok.io`)

---

### ✅ 3. Composio Dashboard Webhook

1. Go to: https://platform.composio.dev/settings/webhooks
2. Verify you added:
   - **URL**: `https://YOUR_NGROK_URL.ngrok.io/api/composio/webhook`
   - **Secret**: Same value as `COMPOSIO_WEBHOOK_SECRET` in your .env
   - **Events**:
     - ✅ `connection.created`
     - ✅ `connection.active`
     - ✅ `connection.failed` (optional)

---

### ✅ 4. Dev Server Running

Make sure your Next.js app is running:

```bash
npm run dev
```

Should show:
```
✓ Ready on http://localhost:3000
```

---

### ✅ 5. Test the Setup!

#### Option A: Connect a New Integration

1. Go to: http://localhost:3000/dashboard/integrations
2. Click "Connect" on Twitter or Reddit
3. Complete OAuth authorization
4. **Watch your terminal!**

You should see:
```bash
📥 Webhook received: {
  "event": "connection.active",
  "payload": {
    "connectedAccountId": "ca_xyz123",
    "integrationId": "reddit",
    "clientUniqueUserId": "default",
    "status": "ACTIVE"
  }
}
✅ Webhook signature verified
✅ Connection ACTIVE for user: default, integration: reddit
```

5. **Watch the browser!**
   - Page should auto-refresh within 3 seconds
   - Green dot appears
   - Username shows up
   - Console shows: `🔔 New connection detected via webhook!`

#### Option B: Test Webhook Manually

Send a test webhook:

```bash
# Replace YOUR_NGROK_URL with your actual ngrok URL
curl -X POST https://YOUR_NGROK_URL.ngrok.io/api/composio/webhook \
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

Should respond:
```json
{
  "received": true,
  "event": "connection.active",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🔍 Debugging

### Issue: Webhook not receiving events

**Check:**
1. ✅ Is ngrok still running? (it stops if you close terminal)
2. ✅ Did ngrok URL change? (it changes each restart on free plan)
3. ✅ Is webhook URL in Composio dashboard up to date?
4. ✅ Is your dev server running?

**Fix:**
- Restart ngrok if needed
- Update webhook URL in Composio dashboard with new ngrok URL
- Restart dev server: `npm run dev`

---

### Issue: "Invalid signature" error

**Check:**
1. ✅ Is `COMPOSIO_WEBHOOK_SECRET` in your `.env` file?
2. ✅ Does it match the secret in Composio dashboard?
3. ✅ Did you restart dev server after adding it?

**Fix:**
```bash
# 1. Verify .env has the secret
cat .env | grep COMPOSIO_WEBHOOK_SECRET

# 2. Restart dev server
npm run dev
```

---

### Issue: Page not auto-updating

**Check:**
1. ✅ Open browser console (F12)
2. ✅ Look for network requests to `/api/composio/webhook?userId=...` every 3 seconds
3. ✅ Check for any errors in console

**Fix:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Check that connection status is "ACTIVE" not "PENDING"

---

### Issue: Terminal shows no webhook received

**Check:**
1. ✅ Go to Composio dashboard: https://platform.composio.dev/settings/webhooks
2. ✅ Click on your webhook
3. ✅ Check "Delivery History" or "Recent Deliveries"
4. ✅ Look for failed attempts

**Common causes:**
- ngrok URL expired/changed
- Webhook URL has typo
- ngrok not running
- Dev server not running

---

## 🎯 Success Criteria

You'll know everything is working when:

✅ **Terminal shows:**
```
📥 Webhook received: {...}
✅ Webhook signature verified
✅ Connection ACTIVE for user: default, integration: reddit
```

✅ **Browser console shows:**
```
🔔 New connection detected via webhook!
```

✅ **UI shows:**
- Green dot on integration card
- Username displayed: "Connected: YourUsername"
- Red "Disconnect" button

✅ **No manual refresh needed!**

---

## 📞 Quick Help

**Everything set up but still not working?**

1. Check both terminals:
   - Terminal 1: `npm run dev` output
   - Terminal 2: `ngrok http 3000` output

2. Try disconnecting and reconnecting:
   - Click "Disconnect" on integration
   - Click "Connect" again
   - Watch terminal for webhook

3. Check Composio webhook logs:
   - https://platform.composio.dev/settings/webhooks
   - View delivery history
   - Check for errors

**Still stuck?** Share:
- Terminal output from both windows
- Browser console errors
- Composio webhook delivery status

---

## 🚀 You're All Set!

Once you see the webhook events coming through and the UI auto-updating, you're done! 

The integration is now fully automated:
1. ✅ Users connect via OAuth
2. ✅ Webhook notifies your app
3. ✅ UI auto-refreshes
4. ✅ Connection status updates in real-time

No manual refresh needed! 🎉

