# API Examples & Integration Guide

This document provides examples of how to integrate with the BrandPilot Approval Gateway.

## Table of Contents

1. [Quick Start Demo](#quick-start-demo)
2. [API Examples](#api-examples)
3. [Webhook Payloads](#webhook-payloads)
4. [Integration Testing](#integration-testing)
5. [Common Patterns](#common-patterns)

## Quick Start Demo

### 1. Start the Gateway

```bash
# Terminal 1: Start Redis
make docker-redis

# Terminal 2: Start the gateway
make run

# Terminal 3: Start mock core service
python tools/mock_core.py
```

### 2. Send a Test Candidate

```bash
# Terminal 4: Seed a candidate
make seed
```

### 3. Approve via WhatsApp/iMessage

Check your phone and send:

```
approve cr_demo_1699999999
```

### 4. See Decision in Mock Core

The mock core service (Terminal 3) will display the decision.

## API Examples

### Creating a Candidate

**Python:**

```python
import httpx

candidate = {
    "id": "cr_abc123",
    "brand_id": "b_acme",
    "platform": "x",
    "source_ref": "1234567890",
    "proposed_text": "Thanks for the feedback! We're working on this feature.",
    "persona": "normal",
    "context_url": "https://twitter.com/user/status/1234567890",
    "risk_flags": [],
    "deadline_sec": 900
}

headers = {
    "Authorization": "Bearer your-secret-here"
}

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8080/candidate",
        json=candidate,
        headers=headers
    )
    print(response.json())
```

**curl:**

```bash
curl -X POST http://localhost:8080/candidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-here" \
  -d '{
    "id": "cr_abc123",
    "brand_id": "b_acme",
    "platform": "x",
    "source_ref": "1234567890",
    "proposed_text": "Thanks for the feedback!",
    "persona": "normal",
    "context_url": "https://twitter.com/user/status/1234567890",
    "deadline_sec": 900
  }'
```

**JavaScript/TypeScript:**

```typescript
const candidate = {
  id: "cr_abc123",
  brand_id: "b_acme",
  platform: "x",
  source_ref: "1234567890",
  proposed_text: "Thanks for the feedback!",
  persona: "normal",
  context_url: "https://twitter.com/user/status/1234567890",
  risk_flags: [],
  deadline_sec: 900
};

const response = await fetch("http://localhost:8080/candidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-secret-here"
  },
  body: JSON.stringify(candidate)
});

const result = await response.json();
console.log(result);
```

### Retrieving Activity

**Python:**

```python
async with httpx.AsyncClient() as client:
    response = await client.get(
        "http://localhost:8080/activity",
        params={"brand_id": "b_acme", "limit": 20}
    )
    activity = response.json()
    
    for entry in activity["activities"]:
        print(f"{entry['id']}: {entry['decision']} ({entry['latency_ms']}ms)")
```

**curl:**

```bash
curl "http://localhost:8080/activity?brand_id=b_acme&limit=20"
```

## Webhook Payloads

### WhatsApp Webhook (from Twilio)

When a user replies to a WhatsApp message, Twilio sends:

```
POST /webhooks/whatsapp

Body (form-encoded):
  From=whatsapp:+15551234567
  To=whatsapp:+14155238886
  Body=approve cr_abc123
  MessageSid=SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### iMessage Webhook (from Photon Kit)

```json
POST /webhooks/imessage

{
  "from": "user@icloud.com",
  "text": "approve cr_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Decision Callback (to core service)

```json
POST http://your-core-service.com/decisions

{
  "id": "cr_abc123",
  "decision": "approved",
  "final_text": "Thanks for the feedback!",
  "decider": "whatsapp:+15551234567",
  "latency_ms": 45230
}
```

## Integration Testing

### Test Scenario 1: Basic Approval Flow

```bash
# 1. Start services
make docker-redis
make run
python tools/mock_core.py

# 2. Send candidate
python tools/seed_candidate.py

# 3. Approve via WhatsApp (on your phone)
# Send: approve cr_demo_...

# 4. Verify decision in mock core output
# Should see "DECISION RECEIVED" with status "approved"
```

### Test Scenario 2: Edit Flow

```bash
# 1. Seed candidate
python tools/seed_candidate.py

# 2. Edit via WhatsApp
# Send: edit cr_demo_...: This is my edited reply text

# 3. Verify in mock core
# Should see decision="edited" with edited text
```

### Test Scenario 3: Rate Limiting

```python
# test_rate_limiting.py
import asyncio
import httpx

async def test_rate_limit():
    headers = {"Authorization": "Bearer your-secret-here"}
    
    # Send 10 candidates rapidly
    for i in range(10):
        candidate = {
            "id": f"cr_test_{i}",
            "brand_id": "b_test",
            "platform": "x",
            "source_ref": f"{1000000 + i}",
            "proposed_text": f"Reply {i}",
            "persona": "normal",
            "context_url": f"https://example.com/{i}",
            "deadline_sec": 900
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8080/candidate",
                json=candidate,
                headers=headers
            )
            result = response.json()
            print(f"Candidate {i}: {result['status']}")
        
        await asyncio.sleep(0.5)

asyncio.run(test_rate_limit())
```

### Test Scenario 4: Timeout Handling

```bash
# 1. Seed candidate with short deadline
curl -X POST http://localhost:8080/candidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-here" \
  -d '{
    "id": "cr_timeout_test",
    "brand_id": "b_test",
    "platform": "x",
    "source_ref": "123",
    "proposed_text": "Test reply",
    "persona": "normal",
    "context_url": "https://example.com/123",
    "deadline_sec": 30
  }'

# 2. Wait 35 seconds without approving

# 3. Check mock core for expired decision
# Should see decision="expired" from "system:timeout"
```

## Common Patterns

### Pattern 1: Retry Failed Decision Callbacks

```python
import asyncio
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def send_decision_with_retry(decision: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://your-core-service.com/decisions",
            json=decision,
            timeout=10.0
        )
        response.raise_for_status()
        return response.json()
```

### Pattern 2: Batch Activity Retrieval

```python
async def get_all_activity(brand_id: str):
    """Get all activity for a brand (handles pagination)."""
    all_activities = []
    limit = 100
    offset = 0
    
    while True:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:8080/activity",
                params={"brand_id": brand_id, "limit": limit}
            )
            
        data = response.json()
        activities = data["activities"]
        
        if not activities:
            break
            
        all_activities.extend(activities)
        
        if len(activities) < limit:
            break
            
        offset += limit
    
    return all_activities
```

### Pattern 3: Multi-Brand Management

```python
brands = ["b_acme", "b_startup", "b_enterprise"]

async def send_candidate_to_multiple_brands(base_candidate: dict):
    """Send similar candidate to multiple brands."""
    tasks = []
    
    for brand_id in brands:
        candidate = base_candidate.copy()
        candidate["brand_id"] = brand_id
        candidate["id"] = f"cr_{brand_id}_{int(time.time())}"
        
        task = send_candidate(candidate)
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    return results
```

## Environment-Specific Examples

### Development

```bash
# .env.development
PORT=8080
REDIS_URL=redis://localhost:6379/0
CORE_DECISION_WEBHOOK=http://localhost:9000/decisions
WEBHOOK_SIGNING_SECRET=dev-secret-123
```

### Staging

```bash
# .env.staging
PORT=8080
REDIS_URL=redis://staging-redis.company.com:6379/0
CORE_DECISION_WEBHOOK=https://staging-core.company.com/decisions
WEBHOOK_SIGNING_SECRET=staging-secret-xyz
```

### Production

```bash
# .env.production
PORT=8080
REDIS_URL=redis://prod-redis.company.com:6379/0
CORE_DECISION_WEBHOOK=https://api.company.com/decisions
WEBHOOK_SIGNING_SECRET=super-secret-production-key
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

## Debugging Tips

### Enable Verbose Logging

```python
# In app/main.py
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

### Check Redis State

```bash
# Connect to Redis
redis-cli

# View all candidate keys
KEYS cr:*:state

# Check a specific candidate
GET cr:abc123:state

# View activity for a brand
ZRANGE activity:b_acme 0 -1 WITHSCORES

# Check rate limit buckets
KEYS bucket:*
HGETALL bucket:wa:prompt:b_acme
```

### Monitor Requests

```bash
# Watch gateway logs in real-time
tail -f gateway.log | grep -E "(candidate|decision|webhook)"
```

---

For more examples, see the test suite in `/tests` and the seed script in `/tools/seed_candidate.py`.

