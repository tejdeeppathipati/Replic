# LLM Generator Service

**Generate contextual, on-brand tweet replies using xAI (Grok).**

## 🎯 **What's New:**

**Now uses FULL brand context from database!**

The LLM Generator fetches **ALL brand information** from the `brand_agent` table:
- ✅ Brand description, values, personality
- ✅ Products, unique value proposition
- ✅ Target market, communication style
- ✅ Content pillars, differentiation
- ✅ Scraped insights from website
- ✅ Question responses (JSONB)
- ✅ And 20+ more fields!

This generates **much better, personalized replies** that truly match your brand voice.

---

## 🚀 **Quick Start:**

```bash
cd llm-generator
pip install -r requirements.txt

# Create .env
cat > .env << EOF
# xAI (Grok) API
XAI_API_KEY=your-xai-api-key

# Supabase (for fetching brand context)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# Run
python -m uvicorn app.main:app --reload --port 8300
```

---

## 📝 **API:**

### Generate Reply (with Full Brand Context)
```bash
POST http://localhost:8300/generate
{
  "tweet_text": "Looking for a good CRM solution for my startup",
  "tweet_id": "1234567890",
  "author_username": "founder_steve",
  "brand_id": "your-brand-uuid",  # ← Fetches ALL context from database!
  "persona": "normal",
  "context_url": "https://x.com/user/status/1234567890"
}

# Returns:
{
  "tweet_id": "1234567890",
  "proposed_text": "We'd love to help! Our CRM is built specifically for startups...",
  "persona": "normal",
  "context_url": "https://x.com/user/status/1234567890",
  "is_valid": true,
  "validation_error": null,
  "character_count": 78
}
```

---

## 🎨 **Personas:**

| Persona | Description | Use Case |
|---------|-------------|----------|
| `normal` | Helpful, friendly, conversational | Most replies |
| `smart` | Knowledgeable expert, data-driven | Technical discussions |
| `technical` | Deep technical specialist | Developer conversations |
| `unhinged` | Witty, bold, memorable | Brand personality |

---

## 🧠 **How It Works:**

### **Old Way (Basic):**
```
System Prompt: "You are {brand_name}. You do {brief description}."
User Prompt: "Reply to this tweet: {tweet_text}"
```
❌ Generic, doesn't capture brand voice

### **New Way (Contextual):**
```
1. Fetch brand_agent data from Supabase (20+ fields!)
2. Build comprehensive system prompt:
   - Brand identity (name, description, values)
   - Products & unique value
   - Communication style & personality
   - Target audience
   - Content focus & differentiation
   - Scraped insights
   - Question responses
3. Generate reply with FULL context
```
✅ **Personalized, on-brand, high-quality replies!**

---

## 📊 **Example Prompt (What Grok Sees):**

```
You are a helpful and friendly brand representative.

=== BRAND IDENTITY ===
Brand: BrandPilot
About us: AI-powered social media engagement platform for modern brands
Products/Services: Twitter monitoring, AI reply generation, approval workflows
What makes us unique: Human-in-the-loop AI ensures every reply is on-brand
Our values: Authenticity, efficiency, brand safety

=== COMMUNICATION STYLE ===
Professional but approachable. Use emojis sparingly. Focus on value, not promotion.

Personality: friendly

=== TARGET AUDIENCE ===
B2B SaaS founders and marketing teams who want to scale social engagement

=== CONTENT FOCUS ===
- Social media marketing
- AI in marketing
- Brand building
- Twitter/X strategies

=== HOW WE STAND OUT ===
Unlike fully automated tools, we keep humans in the loop for quality control

=== REPLY GUIDELINES ===
- Keep replies under 200 characters
- Be authentic and add value to the conversation
- Use the brand voice and personality described above
- Don't be overly promotional or salesy
- Match the tone of the original tweet
- Reference our products/values ONLY when genuinely relevant
- If you can't add value, say "SKIP"
```

**This is MUCH better than:** "You are BrandPilot. You build social media tools."

---

## ✅ **Validation:**

Replies are validated for:
- ✅ Length (under 200 chars)
- ✅ Not empty
- ✅ Not too generic ("thanks for sharing" etc.)

If invalid, `is_valid: false` is returned.

---

## 🧪 **Testing:**

### Test with Real Brand Data
```bash
# Make sure you have a brand in your database first!
curl -X POST http://localhost:8300/test \
  -H "Content-Type: application/json" \
  -d '{
    "tweet_text": "Looking for a good CRM solution",
    "brand_id": "your-actual-brand-uuid",
    "persona": "normal"
  }'
```

### Batch Generation
```bash
POST http://localhost:8300/generate/batch
[
  {
    "tweet_text": "Tweet 1...",
    "tweet_id": "123",
    "brand_id": "your-brand-id",
    "persona": "normal",
    "context_url": "..."
  },
  {
    "tweet_text": "Tweet 2...",
    "tweet_id": "456",
    "brand_id": "your-brand-id",
    "persona": "smart",
    "context_url": "..."
  }
]
```

---

## 🔑 **Environment Variables:**

```bash
# xAI API
XAI_API_KEY=your-xai-api-key-here
XAI_API_BASE=https://api.x.ai/v1
XAI_MODEL=grok-beta

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Generation Settings
MAX_TOKENS=100
TEMPERATURE=0.7
MAX_REPLY_LENGTH=200
```

---

## 📈 **Benefits:**

| Before (Basic) | After (Full Context) |
|----------------|----------------------|
| "Thanks for sharing!" | "Great question! Our CRM handles this with..." |
| Generic responses | On-brand, personalized |
| No brand voice | Matches communication style |
| Ignores differentiation | Highlights unique value |
| Same for all brands | Customized per brand |

---

## ✅ **Status:** UPGRADED! 

Now generates **high-quality, contextual replies** using all your brand information! 🎉
