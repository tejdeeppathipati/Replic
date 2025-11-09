# ⚡ Quick Start: Twilio Integration

## ✅ What's Already Done:
- ✅ Redis installed and running
- ✅ Approval-gateway running on http://localhost:8000
- ✅ Python dependencies installed
- ✅ Twilio credentials configured

---

## 🚀 3 Steps to Complete Setup:

### Step 1: Start ngrok

Open a **NEW terminal window** and run:

```bash
ngrok http 8000
```

**Copy the HTTPS URL** that appears (e.g., `https://abc-123-xyz.ngrok-free.app`)

---

### Step 2: Configure Twilio Webhook

1. Go to: https://console.twilio.com/us1/develop/sms/services
2. Select your Messaging Service (or create one)
3. Go to **Integration** tab (Step 3)
4. Select "**Send a webhook**"
5. Enter:
   - **Request URL:** `https://YOUR-NGROK-URL/webhooks/whatsapp`
   - **Method:** HTTP POST
6. Click **Save**

---

### Step 3: Test It!

Run the test script:

```bash
cd /Users/tejdeeppathipati/Desktop/twitly/approval-gateway
source venv/bin/activate
python tools/test_whatsapp.py
```

**You should receive a WhatsApp message!** 📱

Reply with:
- `approve cr_test_xxx` - to approve
- `reject cr_test_xxx` - to reject  
- `edit cr_test_xxx New text` - to edit

---

## 📊 Check Services Status:

```bash
# Approval Gateway
curl http://localhost:8000/

# Redis
redis-cli ping

# View logs
tail -f /tmp/approval-gateway.log
```

---

## ⚠️ Important Notes:

1. **First time using Twilio WhatsApp Sandbox?**
   - Send `join <your-code>` to `+1 415 523 8886` from WhatsApp
   - You'll receive a confirmation message

2. **ngrok URL changes every restart**
   - You'll need to update the Twilio webhook URL each time
   - For a permanent URL, sign up for ngrok (free): https://ngrok.com/

3. **Production deployment:**
   - Deploy approval-gateway to a server (Railway, Heroku, AWS, etc.)
   - Use the server URL instead of ngrok

---

## 🆘 Need Help?

Check the full guide: `TWILIO_INTEGRATION_GUIDE.md`

