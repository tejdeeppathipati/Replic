# X Fetcher Service

**Core Purpose:** Fetch tweets from X API and filter based on brand keywords from database.

## 🎯 **What It Does:**

1. **Reads brand config from Supabase** (keywords, watched accounts)
2. **Fetches tweets from X API** (mentions + keyword search)
3. **Filters for relevance** (language, risk flags, engagement score)
4. **Returns good candidates** for reply generation

**Simplified:** No Redis, no background polling (for now). Just manual endpoints.

---

## 🚀 **Quick Start:**

### 1. Install Dependencies
```bash
cd x-fetcher
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp ../.env.local .env
# Make sure you have:
# - COMPOSIO_API_KEY
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

### 3. Run Service
```bash
python -m uvicorn app.main:app --reload --port 8200
```

---

## 📝 **API Endpoints:**

### Health Check
```bash
GET http://localhost:8200/
```

### List Active Brands
```bash
GET http://localhost:8200/brands

# Returns brands from database with keywords
```

### Fetch Mentions
```bash
POST http://localhost:8200/fetch/mentions
{
  "brand_id": "your-brand-id"
}

# Returns:
# - Total tweets fetched
# - Number passed filter
# - List of good candidates with relevance scores
```

### Fetch Keyword Search
```bash
POST http://localhost:8200/fetch/search
{
  "brand_id": "your-brand-id"
}

# Builds search query from brand keywords in database
# Returns filtered candidates
```

---

## 🔧 **How It Works:**

### 1. **Brand Configuration (from Supabase)**
```sql
-- Gets from brand_agent table:
- keywords: ["crm", "customer management"]
- watched_accounts: ["influential_user_123"]
- brand_brief: "We build CRM software..."
```

### 2. **Fetch Tweets**
```python
# Get token from Composio (OAuth handled)
token = composio.get_token(brand_id)

# Direct X API call for control
tweets = x_api.get_mentions(token, user_id)
# or
tweets = x_api.search_recent(token, query)
```

### 3. **Filter Each Tweet**
```python
# Check language (English only)
if tweet.lang != "en": skip

# Check risk flags (politics, tragedy, etc.)
if has_risk_flags: skip

# Calculate relevance score
score = (
  0.4 if keyword_match +
  0.3 if trusted_author +
  0.3 if high_engagement
)

# Keep if score >= 0.5
if score >= 0.5: keep as candidate
```

---

## 🧪 **Testing:**

### 1. Check Service
```bash
curl http://localhost:8200/
```

### 2. List Brands
```bash
curl http://localhost:8200/brands
```

### 3. Fetch Mentions
```bash
curl -X POST http://localhost:8200/fetch/mentions \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "test-brand"}'
```

### 4. Fetch Search
```bash
curl -X POST http://localhost:8200/fetch/search \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "test-brand"}'
```

---

## 📊 **Response Example:**

```json
{
  "brand_id": "test-brand",
  "total_fetched": 15,
  "passed_filter": 5,
  "failed_filter": 10,
  "candidates": [
    {
      "tweet_id": "1234567890",
      "text": "Looking for a good CRM solution...",
      "author_id": "987654321",
      "created_at": "2024-01-01T12:00:00.000Z",
      "relevance_score": 0.7,
      "url": "https://x.com/user/status/1234567890"
    }
  ]
}
```

---

## 🎯 **Key Features:**

✅ **Database-driven** - All config from Supabase  
✅ **Composio OAuth** - Tokens managed automatically  
✅ **Direct X API** - More control over fetching  
✅ **Smart filtering** - Language, risk flags, relevance  
✅ **Rate limit aware** - Logs remaining requests  
✅ **Simple** - No Redis, no background jobs (yet)  

---

## 🔗 **Next Steps:**

Once you have good candidates:
1. Send to LLM Generator (Claude) for reply generation
2. Send to Approval Gateway (WhatsApp) for human approval
3. Post approved replies via Composio

---

## 📚 **Files:**

```
x-fetcher/
├── app/
│   ├── main.py              # FastAPI endpoints
│   ├── config.py            # Environment config
│   ├── composio_helper.py   # Get tokens from Composio
│   ├── x_api.py             # Direct X API calls
│   ├── filters.py           # Tweet filtering & scoring
│   └── database.py          # Supabase brand config
├── requirements.txt
└── README.md
```

---

## ✅ **Status:** DONE!

Ready to fetch and filter tweets! 🚀

