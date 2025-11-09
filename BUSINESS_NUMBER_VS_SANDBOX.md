# 📱 Your WhatsApp Setup: Business Number vs Sandbox

## ✅ **You Have a Real WhatsApp Business Number!**

**Your Number:** `+1 555 587 16155` (Brand-Pilot)  
**Status:** ✅ Online  
**Type:** WhatsApp Business API

---

## 🎯 **What Changed:**

### **Before (Sandbox):**
```
TWILIO_WA_NUMBER=whatsapp:+14155238886  ← Sandbox (test only)
```
- ❌ Users must "join" sandbox first
- ❌ Limited to test users only
- ✅ Free

### **After (Your Business Number):**
```
TWILIO_WA_NUMBER=whatsapp:+15558716155  ← Your real number!
```
- ✅ Can send to ANY verified WhatsApp number
- ✅ Professional sender display (Brand-Pilot)
- ✅ No "join sandbox" required
- ⚠️ Message template rules apply

---

## 📋 **WhatsApp Business API Rules:**

Even with your business number, WhatsApp has these rules:

### **1. 24-Hour Conversation Window**

**Scenario A: User Messages You First**
```
User → "Hi Brand-Pilot!"
You → Can reply freely for 24 hours ✅
You → Any message type (text, buttons, etc.) ✅
```

**Scenario B: You Message User First (Your Use Case)**
```
Bot → Generates tweet candidate
Bot → Wants to send approval request to user
WhatsApp → ⚠️ Must use approved message template!
```

### **2. Message Templates**

For **outbound messages** (bot initiating conversation), you must:

1. **Create a message template**
2. **Submit it to Meta/WhatsApp for approval**
3. **Wait 1-2 days for approval**
4. **Use only approved templates**

---

## 🔧 **Your Current Setup:**

### **What Works NOW:**

✅ **Receiving messages** from users  
✅ **Replying** to users (within 24-hour window)  
✅ **Webhook** configured to receive responses  
✅ **Your business number** is active  

### **What Needs Setup for Your Bot:**

⚠️ **Message Template** - For sending approval requests

Your approval message needs to be an **approved template**. Currently, you're sending:

```
🤖 BrandPilot Approval Request

Platform: x
Post: https://x.com/...
Brand: test-brand

Proposed Reply:
"Thanks for sharing this! ..."

Commands:
• Reply 'approve cr_xxx' to approve
• Reply 'reject cr_xxx' to skip
• Reply 'edit cr_xxx New text here' to modify

⏱️ Auto-expires in 15 minutes
```

This needs to become a **WhatsApp-approved template** with variables.

---

## 📝 **How to Create Message Template:**

### **Step 1: Go to WhatsApp Template Manager**

1. Visit: https://business.facebook.com/wa/manage/message-templates/
2. Or in Twilio: https://console.twilio.com/us1/develop/sms/content-and-templates

### **Step 2: Create Template**

**Template Name:** `brandpilot_approval_request`

**Template Content:**
```
🤖 BrandPilot Approval Request

Platform: {{1}}
Post: {{2}}

Proposed Reply:
{{3}}

Reply:
• "approve {{4}}" to approve
• "reject {{4}}" to skip  
• "edit {{4}} <text>" to modify

⏱️ Expires in {{5}} minutes
```

**Variables:**
- `{{1}}` = Platform (x/reddit)
- `{{2}}` = Post URL
- `{{3}}` = Proposed text
- `{{4}}` = Candidate ID
- `{{5}}` = Minutes until expiry

### **Step 3: Submit for Approval**

- Category: **UTILITY** (for transactional messages)
- Language: **English (US)**
- Click **Submit**
- Wait 1-2 days for Meta approval

### **Step 4: Update Your Code**

Once approved, update `approval-gateway/app/whatsapp.py` to use the template.

---

## 🚀 **Quick Test: Your Business Number**

**Test with your number right now:**

```bash
cd /Users/tejdeeppathipati/Desktop/twitly/approval-gateway
source venv/bin/activate
python tools/test_whatsapp.py
```

**What will happen:**

1. ✅ **Twilio will attempt to send** using your business number
2. ⚠️ **You might get an error** about message templates
3. ✅ **OR it might work** if you're within a 24-hour window from a previous conversation

---

## ❓ **FAQ:**

### **Q: Why not just use the sandbox?**
**A:** Sandbox is for testing only. Your business number allows:
- Professional sender name (Brand-Pilot)
- No "join" requirement
- Production-ready
- Higher message limits

### **Q: Do I need templates for RECEIVING messages?**
**A:** No! Templates are only needed when YOU initiate. Receiving messages (webhooks) works perfectly without templates.

### **Q: How long does template approval take?**
**A:** Usually 1-2 business days. Some get approved in hours.

### **Q: Can I test without templates?**
**A:** Yes! If:
- The user messaged you first (within 24 hours)
- OR you're testing in a conversation window
- OR you use the sandbox for testing

### **Q: What if my template gets rejected?**
**A:** Common reasons:
- Message too promotional
- Missing required disclaimers
- Template too long
- Revise and resubmit

---

## 🎯 **Recommended Approach:**

### **For Testing (This Week):**

**Option A:** Use sandbox for development
```bash
# In .env, use:
TWILIO_WA_NUMBER=whatsapp:+14155238886  # Sandbox
```
- Quick testing
- No template approval wait
- Team joins sandbox

**Option B:** Test business number with initiated conversations
```bash
# In .env, use:
TWILIO_WA_NUMBER=whatsapp:+15558716155  # Business
```
- Message yourself first from WhatsApp
- Then test bot replies (24-hour window)

### **For Production (Next Week):**

1. ✅ **Submit message template** (today)
2. ⏳ **Wait for approval** (1-2 days)
3. ✅ **Update code to use template**
4. ✅ **Deploy with business number**
5. 🚀 **Launch!**

---

## 📊 **Summary:**

| Feature | Sandbox | Your Business Number |
|---------|---------|---------------------|
| **Number** | +1 415 523 8886 | +1 555 587 16155 |
| **Status** | Testing | Production Ready |
| **Sender Name** | Sandbox | Brand-Pilot ✅ |
| **Join Required** | Yes ❌ | No ✅ |
| **Templates Needed** | No | Yes (for outbound) |
| **Cost** | Free | Included in Twilio |
| **Best For** | Development | Production |

---

## ✅ **Current Status:**

- ✅ Business number configured
- ✅ Approval gateway running
- ✅ Webhook configured
- ✅ Ready to receive messages
- ⚠️ Message template needed for outbound

**Next Step:** Submit message template for approval, or use sandbox for testing!

---

## 🔗 **Useful Links:**

- **Create Template:** https://business.facebook.com/wa/manage/message-templates/
- **Twilio Templates:** https://console.twilio.com/us1/develop/sms/content-and-templates
- **Template Guidelines:** https://developers.facebook.com/docs/whatsapp/message-templates/guidelines
- **Your Sender:** https://console.twilio.com/us1/develop/sms/senders/whatsapp

