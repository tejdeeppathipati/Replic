# 📅 Daily Poster - Automatic Content Generation

**Generate and post original content daily using xAI and ALL your brand data!**

---

## 🎯 **What It Does:**

1. ✅ **Fetches brand data** from Supabase `brand_agent` table (20+ fields!)
2. ✅ **Generates posts** using xAI (Grok) with full brand context
3. ✅ **Posts automatically** to X via Composio
4. ✅ **Logs everything** to `daily_content` table
5. ✅ **Shows in Activity Feed**

**NO MANUAL WORK!** Set `auto_post=true` in database and posts happen automatically every day!

---

## 🚀 **Quick Start:**

```bash
cd daily-poster
pip install -r requirements.txt

# Create .env
cat > .env << EOF
# xAI (for generating posts)
XAI_API_KEY=your-xai-api-key

# Supabase (for brand data)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Composio (for posting to X)
COMPOSIO_API_KEY=your-composio-key

# When to post daily (UTC time)
POST_TIME_UTC=09:00
EOF

# Run
python -m uvicorn app.main:app --reload --port 8500
```

---

## 📝 **How It Works:**

### **1. Brand Data** (from `brand_agent` table):
The system uses **ALL** these fields to generate posts:
- Brand identity: name, description, values
- Products and unique value proposition
- Target market and communication style
- Content pillars (what to post about!)
- Personality and tone
- Differentiation and competitors
- Scraped insights from website
- Question responses (JSONB)
- And 10+ more fields!

### **2. Prompt Generation** (in `app/prompts.py`):
```python
# THIS IS WHERE THE MAGIC HAPPENS! ✨

system_prompt = """
You are the social media voice for {brand_name}.

=== BRAND IDENTITY ===
Brand: {brand_name}
About us: {description}
Products: {products}
Unique value: {unique_value}
Values: {brand_values}

=== COMMUNICATION STYLE ===
{communication_style}

Personality: {personality}

=== TARGET AUDIENCE ===
{target_market}

=== CONTENT FOCUS ===
{content_pillars}

=== HOW WE STAND OUT ===
{differentiation}

... (and more!)
"""
```

### **3. xAI Generation** (in `app/xai_client.py`):
```python
# Calls xAI (Grok) API
response = await xai_client.generate_post(system_prompt, user_prompt)
# Returns: High-quality, on-brand post!
```

### **4. Auto-Post via Composio**:
```python
entity = composio.get_entity(id=brand_id)
entity.execute("TWITTER_CREATE_TWEET", params={"text": post_text})
```

---

## 🎨 **Post Themes:**

The system automatically chooses themes based on day of week:

| Day | Theme | Example |
|-----|-------|---------|
| Monday | Motivation | "Start the week strong with..." |
| Tuesday | Tips | "Quick tip: Here's how to..." |
| Wednesday | Wisdom | "Industry insight: Did you know..." |
| Thursday | Thought | "What's your take on..." |
| Friday | Feature | "Behind the scenes: Here's how we..." |
| Weekend | Insight | "Weekend reflection: ..." |

---

## 📝 **API Endpoints:**

### Generate Post (without posting)
```bash
POST http://localhost:8500/generate
{
  "brand_id": "your-brand-uuid",
  "theme": "monday_motivation",  # optional
  "auto_post": false
}

# Returns:
{
  "brand_id": "...",
  "post_text": "Start your week with purpose! Here's how we...",
  "character_count": 145,
  "posted": false
}
```

### Generate AND Post
```bash
POST http://localhost:8500/generate
{
  "brand_id": "your-brand-uuid",
  "auto_post": true
}

# Returns:
{
  "brand_id": "...",
  "post_text": "Great insight on AI in marketing...",
  "character_count": 178,
  "posted": true,
  "tweet_id": "1234567890",
  "tweet_url": "https://x.com/i/status/1234567890"
}
```

### Quick Post (shortcut)
```bash
POST http://localhost:8500/post-now/YOUR_BRAND_UUID

# Instantly generates and posts!
```

### Manual Trigger Daily Job
```bash
POST http://localhost:8500/trigger-daily-job

# Posts for ALL brands with auto_post=true
```

### Check Next Post Time
```bash
GET http://localhost:8500/next-post-time

# Returns:
{
  "next_run": "2024-01-02T09:00:00+00:00",
  "configured_time": "09:00"
}
```

---

## ⚙️ **Configuration:**

### Environment Variables:

```bash
# xAI
XAI_API_KEY=your-key
XAI_API_BASE=https://api.x.ai/v1
XAI_MODEL=grok-beta

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key

# Composio
COMPOSIO_API_KEY=your-key

# Scheduling
POST_TIME_UTC=09:00  # When to post daily (UTC)

# Generation
MAX_TOKENS=100
TEMPERATURE=0.8  # More creative for original content
```

### Database Setup:

Make sure brands have `auto_post=true`:

```sql
UPDATE brand_agent 
SET auto_post = true 
WHERE id = 'your-brand-id';
```

---

## 🧪 **Testing:**

### Test Post Generation
```bash
curl -X POST http://localhost:8500/generate \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "your-brand-uuid",
    "auto_post": false
  }'
```

### Test Posting
```bash
curl -X POST http://localhost:8500/post-now/your-brand-uuid
```

### Test Daily Job
```bash
curl -X POST http://localhost:8500/trigger-daily-job
```

---

## 📊 **How Brand Data is Used:**

| Field | How It's Used |
|-------|---------------|
| `brand_name` | Brand identity in prompt |
| `description` | What the brand does |
| `products` | Products/services context |
| `unique_value` | What makes brand special |
| `brand_values` | Core values to reflect |
| `communication_style` | **HOW to communicate** ✨ |
| `personality` | Tone and voice |
| `target_market` | Who we're talking to |
| `content_pillars` | **WHAT to post about** ✨ |
| `differentiation` | How we stand out |
| `scraped_insights` | Website insights |
| `question_responses` | User-provided context |

**All 20+ fields are used to create high-quality, on-brand posts!**

---

## 🎉 **Benefits:**

- ✅ **Fully automatic** - posts daily without manual work
- ✅ **On-brand** - uses ALL your brand context
- ✅ **High-quality** - xAI (Grok) generates smart content
- ✅ **Themed** - different content each day
- ✅ **Logged** - all posts saved to database
- ✅ **Activity feed** - shows in dashboard

---

## ✅ **Status:** READY!

**Just enable auto_post for your brand and posts will go live daily!** 🚀

