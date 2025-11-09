# 🎉 Daily Poster - Complete Guide

**Automatic content generation using xAI and ALL your brand data!**

---

## 🎯 **Complete Flow:**

```
┌─────────────────────────────────────────────┐
│  USER CREATES BRAND (Frontend)              │
│                                             │
│  Fills out form with:                       │
│  - Brand name, description                  │
│  - Products, unique value                   │
│  - Communication style, personality         │
│  - Target market, content pillars           │
│  - And 15+ more fields!                     │
│                                             │
│  Sets: auto_post = true ✅                  │
└─────────────────────────────────────────────┘
                    ↓
         (Saved to Supabase)
                    ↓
┌─────────────────────────────────────────────┐
│  DAILY POSTER SERVICE (Port 8500)           │
│                                             │
│  Runs daily at 9:00 AM UTC (configurable)   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 1: Fetch Brand Data                   │
│                                             │
│  Query Supabase brand_agent table           │
│  WHERE auto_post = true AND is_active = true│
│                                             │
│  Gets ALL 20+ fields:                       │
│  ✅ brand_name, description                 │
│  ✅ products, unique_value                  │
│  ✅ brand_values                            │
│  ✅ communication_style                     │
│  ✅ personality                             │
│  ✅ target_market                           │
│  ✅ content_pillars ← WHAT to post about!  │
│  ✅ differentiation                         │
│  ✅ scraped_insights                        │
│  ✅ question_responses (JSONB)              │
│  ✅ And more!                               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 2: Build Comprehensive Prompt         │
│  (THIS IS WHERE THE MAGIC HAPPENS! ✨)      │
│                                             │
│  File: daily-poster/app/prompts.py          │
│                                             │
│  system_prompt = """                        │
│  You are {brand_name}'s social media voice  │
│                                             │
│  === BRAND IDENTITY ===                     │
│  Brand: {brand_name}                        │
│  About: {description}                       │
│  Products: {products}                       │
│  Unique Value: {unique_value}               │
│  Values: {brand_values}                     │
│                                             │
│  === COMMUNICATION STYLE ===                │
│  {communication_style}                      │
│  Personality: {personality}                 │
│                                             │
│  === TARGET AUDIENCE ===                    │
│  {target_market}                            │
│                                             │
│  === CONTENT FOCUS ===                      │
│  {content_pillars}                          │
│                                             │
│  === HOW WE STAND OUT ===                   │
│  {differentiation}                          │
│                                             │
│  === KEY INSIGHTS ===                       │
│  {scraped_insights}                         │
│                                             │
│  === POST GUIDELINES ===                    │
│  - Keep under 280 characters                │
│  - Be authentic and valuable                │
│  - Match our brand voice                    │
│  - Focus on our content pillars             │
│  - Highlight what makes us unique           │
│  """                                        │
│                                             │
│  user_prompt = """                          │
│  Generate a high-quality daily tweet        │
│  based on our content pillars and           │
│  brand voice. Provide real value.           │
│  """                                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 3: Call xAI (Grok) API                │
│                                             │
│  File: daily-poster/app/xai_client.py       │
│                                             │
│  POST https://api.x.ai/v1/chat/completions  │
│  {                                          │
│    "model": "grok-beta",                    │
│    "messages": [                            │
│      {"role": "system", "content": ...},    │
│      {"role": "user", "content": ...}       │
│    ],                                       │
│    "max_tokens": 100,                       │
│    "temperature": 0.8                       │
│  }                                          │
│                                             │
│  Returns: Generated post text               │
│  Example: "Start your week with focus!      │
│  Here's how we help teams stay aligned..."  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 4: Post to X via Composio             │
│                                             │
│  File: daily-poster/app/main.py             │
│                                             │
│  entity = composio.get_entity(id=brand_id)  │
│  entity.execute(                            │
│    action=Action.TWITTER_POST_TWEET,        │
│    params={"text": post_text}               │
│  )                                          │
│                                             │
│  Returns: tweet_id, status                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 5: Log to Supabase                    │
│                                             │
│  INSERT INTO daily_content (                │
│    brand_id,                                │
│    content,                                 │
│    platform,                                │
│    tweet_id,                                │
│    status,                                  │
│    created_at                               │
│  )                                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 6: Show in Activity Feed              │
│                                             │
│  File: app/dashboard/activity/page.tsx      │
│                                             │
│  Fetches from daily_content table           │
│  Shows:                                     │
│  ✅ Post text                               │
│  ✅ Status (posted/failed)                  │
│  ✅ Link to tweet                           │
│  ✅ Timestamp                               │
│  ✅ Error (if failed)                       │
└─────────────────────────────────────────────┘
```

---

## 📍 **Key Files:**

### **1. Prompt Generation** ✨
**File:** `daily-poster/app/prompts.py`

This is where xAI prompt is built using ALL 20+ brand fields!

```python
def build_post_generation_prompt(brand_data: dict) -> tuple[str, str]:
    # Extracts ALL fields from brand_agent
    # Builds comprehensive system prompt
    # Returns (system_prompt, user_prompt)
```

### **2. xAI Client**
**File:** `daily-poster/app/xai_client.py`

Calls xAI (Grok) API:

```python
class XAIClient:
    async def generate_post(system_prompt, user_prompt) -> str:
        # Calls https://api.x.ai/v1/chat/completions
        # Returns generated post text
```

### **3. Main Service**
**File:** `daily-poster/app/main.py`

Orchestrates everything:

```python
@app.post("/generate")
async def generate_post(request):
    # 1. Fetch brand data from Supabase
    # 2. Build prompt
    # 3. Call xAI
    # 4. Post via Composio
    # 5. Log to database
```

### **4. Database Layer**
**File:** `daily-poster/app/database.py`

```python
async def get_brand_for_posting(brand_id):
    # Fetches brand_agent row with ALL fields
    
async def log_post(brand_id, post_text, tweet_id):
    # Logs to daily_content table
```

### **5. Activity Feed**
**File:** `app/dashboard/activity/page.tsx`

```typescript
// Fetches from daily_content table
// Shows posted tweets with status
// Auto-refreshes every 10 seconds
```

---

## 🚀 **How to Use:**

### **Option 1: Automatic (Recommended)**

```sql
-- Enable auto-posting for a brand
UPDATE brand_agent 
SET auto_post = true 
WHERE id = 'your-brand-uuid';

-- Posts will go live daily at 9:00 AM UTC automatically!
```

### **Option 2: Manual API Call**

```bash
# Generate and post now
curl -X POST http://localhost:8500/post-now/YOUR_BRAND_UUID

# Or just generate (without posting)
curl -X POST http://localhost:8500/generate \
  -d '{"brand_id":"YOUR_UUID","auto_post":false}'
```

### **Option 3: Test Daily Job**

```bash
# Manually trigger daily job (posts for ALL brands)
curl -X POST http://localhost:8500/trigger-daily-job
```

---

## 🎨 **Themed Posts:**

Posts automatically use day-specific themes:

| Day | Theme | Example Prompt |
|-----|-------|----------------|
| Monday | Motivation | "Generate inspiring Monday motivation..." |
| Tuesday | Tips | "Share valuable, actionable tip..." |
| Wednesday | Wisdom | "Share insightful industry perspective..." |
| Thursday | Thought | "Pose thought-provoking question..." |
| Friday | Feature | "Highlight product/team feature..." |
| Weekend | Insight | "Share weekend-appropriate insight..." |

---

## 📊 **Database Tables:**

### **brand_agent** (Source)
All brand data comes from here:
- `brand_name`, `description`, `products`
- `unique_value`, `brand_values`
- `communication_style`, `personality`
- `target_market`, `content_pillars`
- `differentiation`, `competitors`
- `scraped_insights`, `question_responses`
- **`auto_post`** ← Enable automatic posting!
- `is_active` ← Must be true

### **daily_content** (Destination)
All posts are logged here:
- `id` (UUID)
- `brand_id` (FK to brand_agent)
- `content` (Post text)
- `platform` ("x")
- `tweet_id` (X tweet ID)
- `status` ("posted" or "failed")
- `error_message` (If failed)
- `created_at` (Timestamp)

---

## ⚙️ **Configuration:**

### **Environment Variables:**

```bash
# daily-poster/.env

# xAI (for generating posts)
XAI_API_KEY=your-xai-key

# Supabase (for brand data)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key

# Composio (for posting to X)
COMPOSIO_API_KEY=your-key

# When to post daily (UTC)
POST_TIME_UTC=09:00
```

---

## 🧪 **Testing:**

### **1. Start Service:**
```bash
cd daily-poster
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8500
```

### **2. Enable auto_post for Brand:**
```sql
UPDATE brand_agent SET auto_post = true WHERE id = 'your-uuid';
```

### **3. Test Post Generation:**
```bash
curl -X POST http://localhost:8500/generate \
  -H "Content-Type: application/json" \
  -d '{"brand_id":"your-uuid","auto_post":false}'
```

### **4. Test Posting:**
```bash
curl -X POST http://localhost:8500/post-now/your-uuid
```

### **5. Check Activity Feed:**
Go to: http://localhost:3000/dashboard/activity

You should see your post! ✅

---

## ✅ **Benefits:**

| Feature | Status |
|---------|--------|
| **Uses ALL Brand Data** | ✅ 20+ fields |
| **xAI (Grok) Generation** | ✅ High quality |
| **Automatic Posting** | ✅ Daily at 9 AM |
| **Themed Posts** | ✅ Different each day |
| **Activity Feed** | ✅ Shows all posts |
| **Error Handling** | ✅ Logs failures |
| **No Manual Work** | ✅ Set and forget |

---

## 🎉 **Summary:**

**YOU DON'T NEED TO RUN ANYTHING WITH `brand_id` MANUALLY!**

1. ✅ User creates brand in frontend (fills out form)
2. ✅ Data saved to Supabase `brand_agent` table
3. ✅ Enable `auto_post=true`
4. ✅ Daily Poster runs automatically at 9 AM
5. ✅ Fetches brand data (ALL 20+ fields)
6. ✅ Builds comprehensive prompt
7. ✅ Generates post with xAI (Grok)
8. ✅ Posts to X via Composio
9. ✅ Shows in Activity Feed

**FULLY AUTOMATIC!** 🚀

