# 🚀 Twilio WhatsApp Integration Guide

## ✅ Setup Complete

### Services Running:
- ✅ **Redis**: Running on localhost:6379
- ✅ **Approval Gateway**: Running on http://localhost:8000
- ✅ **Python Dependencies**: Installed in virtual environment

---

## 📋 Next Steps

### Step 1: Start ngrok (Required for Twilio Webhooks)

Open a **NEW terminal window** and run:

```bash
ngrok http 8000
```

You'll see output like this:
```
Session Status                online
Account                       your-account
Version                       3.x.x
Region                       United States (us)
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:8000
```

**Copy the `https://` URL** (e.g., `https://abc123xyz.ngrok-free.app`)

---

### Step 2: Configure Twilio Messaging Service Webhook

1. Go to your Twilio Console: https://console.twilio.com/
2. Navigate to: **Messaging** → **Services** → Select your service
3. Click on **Integration** (Step 3)
4. Select "**Send a webhook**"
5. Enter your webhook URLs:

**Request URL:**
```
https://YOUR-NGROK-URL.ngrok-free.app/webhooks/whatsapp
```

**Method:** HTTP POST

**Fallback URL (optional):**
```
https://YOUR-NGROK-URL.ngrok-free.app/webhooks/whatsapp
```

**Method:** HTTP POST

6. Click **Save**

---

### Step 3: Test the Approval Flow

#### A. Send a Test Candidate

Use the seed script to create a test candidate:

```bash
cd approval-gateway
source venv/bin/activate
python tools/seed_candidate.py
```

This will:
- Create a test candidate reply
- Send it to the approval-gateway
- Send you a WhatsApp message with approval options

#### B. Respond via WhatsApp

You'll receive a message on WhatsApp like:

```
🤖 BrandPilot Approval Request

Platform: x
Post: https://x.com/user/status/123456
Brand: test-brand

Proposed Reply:
"This is a great insight! Let me share our experience..."

Commands:
• Reply 'approve cr_xxx' to approve
• Reply 'reject cr_xxx' to skip
• Reply 'edit cr_xxx New text here' to modify
```

**Respond with:**
- `approve cr_xxx` - to approve the reply
- `reject cr_xxx` - to skip it
- `edit cr_xxx Your new text` - to modify and approve

#### C. Check the Logs

The approval-gateway will log the received command:

```bash
tail -f /tmp/approval-gateway.log
```

---

## 🔍 Troubleshooting

### Issue: Ngrok URL changes every time
**Solution:** Sign up for a free ngrok account and use an auth token for persistent URLs:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
ngrok http 8000
```

### Issue: WhatsApp messages not received
**Check:**
1. ✅ Is ngrok running? `curl http://localhost:4040`
2. ✅ Is the webhook URL correct in Twilio?
3. ✅ Is the approval-gateway running? `curl http://localhost:8000`

### Issue: Twilio signature validation fails
**Solution:** The approval-gateway automatically validates Twilio signatures. Make sure your `TWILIO_AUTH_TOKEN` in `.env` matches your Twilio account.

---

## 📊 Service Status

Check if services are running:

```bash
# Check Redis
redis-cli ping

# Check Approval Gateway
curl http://localhost:8000/

# Check ngrok
curl http://localhost:4040/status

# View approval-gateway logs
tail -f /tmp/approval-gateway.log
```

---

## 🎯 Current Configuration

### Approval Gateway:
- **Port:** 8000
- **Twilio Account SID:** `AC...` (from .env file)
- **WhatsApp Number:** `whatsapp:+14155238886` (Twilio Sandbox)
- **Owner Number:** `whatsapp:+1XXXXXXXXXX` (Your number)

### Rate Limiting:
- **WhatsApp Prompts:** 5 per bucket, refills 1/min
- **Minimum Spacing:** 20 seconds between prompts

---

## 🛠️ Restart All Services

If you need to restart everything:

```bash
# Stop all services
killall ngrok python3

# Start Redis
brew services restart redis

# Start Approval Gateway
cd /Users/tejdeeppathipati/Desktop/twitly/approval-gateway
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000 > /tmp/approval-gateway.log 2>&1 &

# Start ngrok (in a separate terminal)
ngrok http 8000
```

---

## 📱 Twilio Messaging Service Setup

Your Twilio account is configured with:
- **Account SID:** `AC...` (stored in .env file)
- **WhatsApp Sandbox Number:** `+1 415 523 8886`
- **Format:** `whatsapp:+14155238886`

To test, send a WhatsApp message to join the sandbox first:
1. Send `join <code>` to `+1 415 523 8886` from WhatsApp
2. Follow the instructions to join the sandbox

---

## 🔗 Important URLs

- **Approval Gateway Health:** http://localhost:8000/
- **Ngrok Web Interface:** http://localhost:4040/
- **Twilio Console:** https://console.twilio.com/
- **Twilio Messaging Services:** https://console.twilio.com/us1/develop/sms/services

---

## 📖 API Endpoints

### Approval Gateway Endpoints:

- **GET /** - Health check
- **POST /candidate** - Receive candidate for approval
- **POST /webhooks/whatsapp** - Twilio WhatsApp webhook
- **POST /webhooks/imessage** - iMessage webhook (optional)
- **GET /activity?brand_id=xxx** - Get activity logs

---

## 🎉 You're All Set!

Your Twilio integration is ready! Just:
1. ✅ Start ngrok in a separate terminal
2. ✅ Copy the ngrok URL to Twilio
3. ✅ Test with the seed script

**Need help?** Check the logs at `/tmp/approval-gateway.log`

