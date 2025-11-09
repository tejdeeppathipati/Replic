# 🐦 X API Integration - Implementation Plan

## 📋 **What We're Building:**

A complete X (Twitter) bot that:
1. **Fetches** mentions and keyword-matched tweets
2. **Filters** with guardrails (risk flags, relevance)
3. **Generates** AI replies (Claude/GPT)
4. **Sends** for approval via WhatsApp ✅ (Already done!)
5. **Posts** approved replies back to X

---

## 🏗️ **Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                    BrandPilot System                          │
└──────────────────────────────────────────────────────────────┘

[X API]
   ↓ Every 60s
[Fetcher Service] ← polls mentions + keyword search
   ↓ New tweets
[Filter Engine] ← risk flags, relevance scoring
   ↓ Good candidates
[LLM Generator] ← Claude/GPT generates reply
   ↓ Candidate reply
[Approval Gateway] ✅ ← WhatsApp/iMessage (DONE!)
   ↓ Human decision
[X Poster] ← POST to X API
   ↓
[Analytics DB] ← Supabase
```

---

## 📦 **Components to Build:**

### **1. X OAuth Service** (`x-oauth/`)
**Purpose:** Get OAuth 2.0 tokens for posting

**Files:**
```
x-oauth/
├── app/
│   ├── main.py          # FastAPI server
│   ├── oauth.py         # PKCE flow
│   └── config.py        # X API credentials
├── requirements.txt
└── .env
```

**Key Features:**
- OAuth 2.0 with PKCE (Authorization Code flow)
- Store access_token, refresh_token in Supabase
- Auto-refresh expired tokens
- Scopes: `tweet.read tweet.write users.read offline.access`

**Endpoints:**
- `GET /x/connect` - Start OAuth flow
- `GET /x/callback` - Handle OAuth callback
- `GET /x/refresh` - Refresh expired token

---

### **2. X Fetcher Service** (`x-fetcher/`)
**Purpose:** Poll X API for new mentions & keyword matches

**Files:**
```
x-fetcher/
├── app/
│   ├── main.py          # FastAPI + background scheduler
│   ├── fetcher.py       # X API calls
│   ├── config.py        # Environment config
│   └── models.py        # Pydantic models
├── requirements.txt
└── .env
```

**Key Features:**
- Poll every 60s
- GET `/2/users/:id/mentions` (mentions timeline)
- GET `/2/tweets/search/recent` (keyword search)
- Track `since_id` per query (avoid duplicates)
- Rate limit aware (backoff on 429)
- Store new tweets in Redis queue

**API Calls:**
```python
# Mentions
GET https://api.x.com/2/users/{user_id}/mentions
  ?max_results=25
  &since_id=1234567890
  &expansions=author_id,referenced_tweets.id
  &tweet.fields=created_at,lang,public_metrics,conversation_id

# Keyword Search
GET https://api.x.com/2/tweets/search/recent
  ?query=(brand OR "keyword" OR @handle) lang:en -is:retweet
  &max_results=25
  &since_id=1234567890
  &expansions=author_id,referenced_tweets.id
  &tweet.fields=created_at,lang,public_metrics,conversation_id
```

---

### **3. Filter Engine** (`x-fetcher/filters.py`)
**Purpose:** Apply guardrails before sending to LLM

**Filters:**
```python
class TweetFilter:
    def check_language(tweet) -> bool:
        # Only English
        return tweet.lang == "en"
    
    def check_risk_flags(tweet) -> list[str]:
        # Detect: politics, tragedy, sensitive topics
        risk_patterns = [
            r"\b(trump|biden|politics|election)\b",
            r"\b(death|died|tragedy|shooting)\b",
            r"\b(racist|sexist|offensive)\b"
        ]
        flags = []
        for pattern in risk_patterns:
            if re.search(pattern, tweet.text, re.I):
                flags.append(pattern)
        return flags
    
    def check_relevance_score(tweet) -> float:
        # Score based on:
        # - Keyword match (0.4)
        # - Author whitelist (0.3)
        # - Engagement (0.3)
        score = 0.0
        
        if keyword_match(tweet.text):
            score += 0.4
        
        if tweet.author_id in whitelist:
            score += 0.3
        
        engagement = tweet.public_metrics.like_count + tweet.public_metrics.reply_count
        if engagement >= 10:
            score += 0.3
        
        return score
    
    def should_respond(tweet) -> tuple[bool, list[str]]:
        if not check_language(tweet):
            return False, ["non_english"]
        
        risk_flags = check_risk_flags(tweet)
        if risk_flags:
            return False, risk_flags
        
        score = check_relevance_score(tweet)
        if score < 0.6:
            return False, ["low_relevance"]
        
        return True, []
```

---

### **4. LLM Reply Generator** (`llm-generator/`)
**Purpose:** Generate AI replies using Claude/GPT

**Files:**
```
llm-generator/
├── app/
│   ├── main.py          # FastAPI server
│   ├── generator.py     # LLM calls
│   ├── prompts.py       # Persona prompts
│   └── config.py        # API keys
├── requirements.txt
└── .env
```

**Key Features:**
- Use Claude API (you already have key in .env)
- Apply persona (normal/smart/technical/unhinged)
- Keep replies under 200 characters
- Include brand context (brand_brief, faqs)

**Prompt Templates:**
```python
PERSONAS = {
    "normal": "You are a helpful brand representative...",
    "smart": "You are a knowledgeable expert...",
    "technical": "You are a technical specialist...",
    "unhinged": "You are witty and bold (but still professional)..."
}

def generate_reply(tweet_text, brand_context, persona="normal"):
    prompt = f"""
    {PERSONAS[persona]}
    
    Brand: {brand_context.name}
    What we do: {brand_context.brief}
    
    Respond to this tweet:
    "{tweet_text}"
    
    Rules:
    - Under 200 characters
    - Be helpful and genuine
    - Don't be salesy
    - Add value to the conversation
    
    Your reply:
    """
    
    response = anthropic.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.content[0].text
```

---

### **5. X Poster Service** (`x-poster/`)
**Purpose:** Post approved replies back to X

**Files:**
```
x-poster/
├── app/
│   ├── main.py          # FastAPI server
│   ├── poster.py        # X API post calls
│   └── config.py        # Environment config
├── requirements.txt
└── .env
```

**Key Features:**
- POST `/2/tweets` with `reply.in_reply_to_tweet_id`
- Use OAuth 2.0 access tokens
- Auto-refresh expired tokens
- Daily rate limit tracking (30 replies/day)

**API Call:**
```python
async def post_reply(access_token, text, in_reply_to_tweet_id):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "reply": {"in_reply_to_tweet_id": in_reply_to_tweet_id}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.x.com/2/tweets",
            json=payload,
            headers=headers
        )
    
    response.raise_for_status()
    return response.json()
```

---

### **6. Core Orchestrator** (`core/`)
**Purpose:** Tie everything together

**Files:**
```
core/
├── app/
│   ├── main.py          # Main orchestrator
│   ├── scheduler.py     # Background jobs
│   ├── pipeline.py      # Fetch → Filter → Generate → Approve → Post
│   └── config.py        # Config
├── requirements.txt
└── .env
```

**Pipeline Flow:**
```python
async def process_pipeline(brand_id):
    # 1. Fetch new tweets
    tweets = await fetch_new_tweets(brand_id)
    
    # 2. Filter
    candidates = []
    for tweet in tweets:
        should_respond, flags = filter_tweet(tweet)
        if should_respond:
            candidates.append(tweet)
    
    # 3. Generate replies
    for candidate in candidates:
        reply_text = await generate_reply(
            tweet_text=candidate.text,
            brand_context=get_brand_context(brand_id),
            persona=get_brand_persona(brand_id)
        )
        
        # 4. Send for approval
        approval_response = await send_to_approval_gateway({
            "id": f"cr_{uuid4()}",
            "brand_id": brand_id,
            "platform": "x",
            "source_ref": candidate.id,
            "proposed_text": reply_text,
            "persona": get_brand_persona(brand_id),
            "context_url": f"https://x.com/user/status/{candidate.id}",
            "risk_flags": flags,
            "deadline_sec": 900,
            "owner_whatsapp": get_owner_whatsapp(brand_id),
            "owner_imessage": get_owner_imessage(brand_id)
        })
    
    # 5. Wait for approval (webhook callback from approval-gateway)
    # 6. Post approved replies (handled by decision webhook)
```

---

## 📊 **Rate Limits (X API):**

| Endpoint | Limit | Strategy |
|----------|-------|----------|
| `/2/users/:id/mentions` | 450/15min | Poll every 60s |
| `/2/tweets/search/recent` | 180/15min | Poll every 60s, combine queries |
| `POST /2/tweets` | 300/15min | Daily cap at 30, token bucket |

**Backoff Strategy:**
```python
def check_rate_limit(response):
    remaining = int(response.headers.get("x-rate-limit-remaining", 999))
    reset_time = int(response.headers.get("x-rate-limit-reset", 0))
    
    if remaining < 10:
        wait_seconds = reset_time - time.time()
        await asyncio.sleep(max(wait_seconds, 60))
```

---

## 🗄️ **Database Schema (Already in Supabase):**

You already have these tables:
- ✅ `app_user` - User accounts
- ✅ `brand_agent` - Brand configurations
- ✅ `oauth_credential` - X OAuth tokens
- ✅ `candidate_event` - Tweet candidates
- ✅ `activity_log` - All activities
- ✅ `rate_limit_usage` - Rate limiting counters

---

## 🚀 **Implementation Order:**

### **Phase 1: X OAuth (Week 1)**
1. Create `x-oauth/` service
2. Implement PKCE flow
3. Store tokens in Supabase
4. Test with your X account

### **Phase 2: X Fetcher (Week 1-2)**
1. Create `x-fetcher/` service
2. Implement mentions polling
3. Implement keyword search
4. Add filters & scoring
5. Queue candidates in Redis

### **Phase 3: LLM Generator (Week 2)**
1. Create `llm-generator/` service
2. Implement Claude integration
3. Add persona prompts
4. Test reply generation

### **Phase 4: Integration (Week 2-3)**
1. Connect fetcher → generator
2. Connect generator → approval-gateway ✅
3. Handle approval decisions
4. Create X poster service
5. Post approved replies

### **Phase 5: Polish (Week 3)**
1. Add error handling
2. Add logging/monitoring
3. Add analytics dashboard
4. Deploy to production

---

## 🧪 **Testing Strategy:**

**Unit Tests:**
- Filter logic
- LLM prompts
- Rate limiting

**Integration Tests:**
- Fetch → Filter → Generate pipeline
- Approval flow (already working!)
- Post to X (use test account)

**End-to-End Test:**
1. Create test tweet mentioning your brand
2. Bot fetches it
3. Generates reply
4. Sends to WhatsApp ✅
5. You approve
6. Bot posts reply

---

## 📝 **Environment Variables Needed:**

```bash
# X API (Developer Portal)
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret
X_REDIRECT_URI=http://localhost:8000/x/callback
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_BEARER_TOKEN=your_bearer_token

# Claude AI (Already have)
CLAUDE_API_KEY=sk-ant-api03-SQSZ...

# Supabase (Already have)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Approval Gateway (Already configured)
APPROVAL_GATEWAY_URL=http://localhost:8000

# Redis (Already have)
REDIS_URL=redis://localhost:6379/0
```

---

## 🎯 **Next Steps:**

1. **Get X API Access:**
   - Go to: https://developer.x.com/
   - Create a new app
   - Enable OAuth 2.0
   - Get credentials

2. **Build X OAuth Service:**
   - Start with the code skeleton provided in your spec
   - Test the PKCE flow
   - Store tokens in Supabase

3. **Build X Fetcher:**
   - Implement mentions polling
   - Test with your account

4. **Connect to Approval Gateway:**
   - Use the `/candidate` endpoint we built
   - Test end-to-end flow

---

## 📚 **Resources:**

- **X API Docs:** https://developer.x.com/en/docs/twitter-api
- **OAuth 2.0 PKCE:** https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
- **Rate Limits:** https://developer.x.com/en/docs/twitter-api/rate-limits
- **Claude API:** https://docs.anthropic.com/
- **Your Approval Gateway:** Already running at `localhost:8000` ✅

---

## 🎉 **What's Already Done:**

✅ **Approval Gateway** - Working!
✅ **WhatsApp Integration** - Configured!
✅ **Database Schema** - In Supabase!
✅ **Frontend Auth** - Working!

**You're 25% done! Let's build the X API integration next!** 🚀

