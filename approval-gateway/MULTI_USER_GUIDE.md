# Multi-User Support Guide

## Overview

The BrandPilot Approval Gateway now supports **dynamic phone numbers** per candidate. This means each brand/user can have their own WhatsApp number and iMessage address for receiving approval prompts.

## Key Changes

### ✅ What Changed

1. **Candidate Model** - Added two new optional fields:
   - `owner_whatsapp` - WhatsApp number for this specific candidate
   - `owner_imessage` - iMessage email/phone for this specific candidate

2. **Dynamic Recipients** - The gateway now sends approval prompts to the phone number/email specified in each candidate request, rather than a single hardcoded number.

3. **Fallback Support** - If a candidate doesn't specify owner contact info, the gateway falls back to the environment variable defaults (`OWNER_WA_NUMBER` and `PHOTON_TO`).

### 🔄 Migration from Single User

**Before (single hardcoded user):**
```bash
# .env
OWNER_WA_NUMBER=whatsapp:+15551234567
PHOTON_TO=owner@example.com
```

**After (multi-user support):**
```bash
# .env - These are now FALLBACK defaults
OWNER_WA_NUMBER=whatsapp:+15551234567  # Optional fallback
PHOTON_TO=owner@example.com            # Optional fallback
```

## How to Use

### Option 1: Per-Candidate Phone Numbers (Recommended)

Include the owner's contact info in each candidate request:

```python
# Python example
candidate = {
    "id": "cr_abc123",
    "brand_id": "b_user_alice",
    "platform": "x",
    "source_ref": "1234567890",
    "proposed_text": "Thanks for asking!",
    "persona": "smart",
    "context_url": "https://twitter.com/user/status/1234567890",
    "deadline_sec": 900,
    
    # NEW: Specify owner contact info ✅
    "owner_whatsapp": "whatsapp:+14155551234",  # Alice's WhatsApp
    "owner_imessage": "alice@startup.com"       # Alice's iMessage
}

response = requests.post(
    "http://localhost:8080/candidate",
    json=candidate,
    headers={"Authorization": "Bearer your-secret"}
)
```

**For different users:**

```python
# User Tejdeep
candidate_1 = {
    "id": "cr_tej_001",
    "brand_id": "b_tejdeep",
    "owner_whatsapp": "whatsapp:+919876543210",  # Tejdeep's number
    "owner_imessage": "tejdeep@example.com",
    # ... rest of fields
}

# User Alice  
candidate_2 = {
    "id": "cr_alice_001",
    "brand_id": "b_alice",
    "owner_whatsapp": "whatsapp:+14155551234",   # Alice's number
    "owner_imessage": "alice@startup.com",
    # ... rest of fields
}

# User Bob
candidate_3 = {
    "id": "cr_bob_001", 
    "brand_id": "b_bob",
    "owner_whatsapp": "whatsapp:+447700900123",  # Bob's UK number
    "owner_imessage": "bob@company.co.uk",
    # ... rest of fields
}
```

### Option 2: Use Environment Fallback

If you don't include owner contact fields, the gateway will use the defaults from `.env`:

```python
candidate = {
    "id": "cr_xyz789",
    "brand_id": "b_default",
    "platform": "x",
    "proposed_text": "Hello!",
    # ... other fields
    
    # owner_whatsapp: None (will use OWNER_WA_NUMBER from .env)
    # owner_imessage: None (will use PHOTON_TO from .env)
}
```

## Integration Examples

### Next.js Core Bot Integration

```typescript
// Your core BrandPilot bot
interface BrandAgent {
  id: string;
  user_id: string;
  owner_whatsapp: string;
  owner_imessage: string;
  // ... other fields
}

async function sendCandidateForApproval(
  agent: BrandAgent,
  candidateReply: string,
  platform: 'x' | 'reddit',
  sourceRef: string,
  contextUrl: string
) {
  const candidate = {
    id: `cr_${Date.now()}`,
    brand_id: agent.id,
    platform,
    source_ref: sourceRef,
    proposed_text: candidateReply,
    persona: agent.persona,
    context_url: contextUrl,
    deadline_sec: 900,
    
    // Include agent owner's contact info ✅
    owner_whatsapp: agent.owner_whatsapp,
    owner_imessage: agent.owner_imessage
  };
  
  const response = await fetch('http://approval-gateway:8080/candidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WEBHOOK_SIGNING_SECRET}`
    },
    body: JSON.stringify(candidate)
  });
  
  return response.json();
}
```

### Database Schema

Store owner contact info with each brand:

```sql
-- Add to your existing brand_agent table
ALTER TABLE brand_agent 
ADD COLUMN owner_whatsapp TEXT,
ADD COLUMN owner_imessage TEXT;

-- Update existing records
UPDATE brand_agent 
SET 
  owner_whatsapp = 'whatsapp:+' || user.phone,
  owner_imessage = user.email
FROM app_user user
WHERE brand_agent.user_id = user.id;
```

### Multi-Tenant SaaS

```typescript
// Fetch brand with owner info
const brand = await db.brand_agent.findUnique({
  where: { id: brandId },
  include: { 
    user: {
      select: {
        whatsapp_number: true,
        imessage_email: true
      }
    }
  }
});

// Send candidate with user-specific contact
await sendCandidate({
  // ... candidate fields
  owner_whatsapp: brand.user.whatsapp_number,
  owner_imessage: brand.user.imessage_email
});
```

## Testing Multi-User Setup

### Test with seed script

Edit `tools/seed_candidate.py`:

```python
# Test User 1
candidate_1 = {
    "id": "cr_test_user1",
    "brand_id": "b_user1",
    "proposed_text": "Test for User 1",
    "owner_whatsapp": "whatsapp:+15551111111",  # User 1's number
    "owner_imessage": "user1@test.com",
    # ... rest
}

# Test User 2
candidate_2 = {
    "id": "cr_test_user2", 
    "brand_id": "b_user2",
    "proposed_text": "Test for User 2",
    "owner_whatsapp": "whatsapp:+15552222222",  # User 2's number
    "owner_imessage": "user2@test.com",
    # ... rest
}
```

### Verify routing

1. Send candidate with User 1's number → User 1 receives WhatsApp
2. Send candidate with User 2's number → User 2 receives WhatsApp
3. Each user approves their own → decision goes back to core

## API Changes

### POST /candidate

**Updated Request Body:**

```json
{
  "id": "cr_abc123",
  "brand_id": "b_acme",
  "platform": "x",
  "source_ref": "1234567890",
  "proposed_text": "Great question!",
  "persona": "smart",
  "context_url": "https://twitter.com/status/1234567890",
  "risk_flags": [],
  "deadline_sec": 900,
  
  "owner_whatsapp": "whatsapp:+15551234567",  // NEW ✅
  "owner_imessage": "owner@example.com"       // NEW ✅
}
```

**Both fields are optional:**
- If provided: sends to specified number/email
- If omitted: uses environment fallback (backward compatible)

### No Changes to Other Endpoints

- `/webhooks/whatsapp` - Works as before
- `/webhooks/imessage` - Works as before  
- `/activity` - Works as before

## Rate Limiting

Rate limits still apply **per brand**, not per phone number:

```python
# Same brand_id with different owners
candidate_1 = {"brand_id": "b_acme", "owner_whatsapp": "whatsapp:+1111"}
candidate_2 = {"brand_id": "b_acme", "owner_whatsapp": "whatsapp:+2222"}

# Both share the same rate limit bucket for brand "b_acme"
# Max 5 prompts/min per brand (configurable)
```

To rate limit per user instead:

```python
# Option: Use user_id as brand_id
candidate = {
    "brand_id": f"user_{user_id}",  # One "brand" per user
    "owner_whatsapp": user.whatsapp,
    # ...
}
```

## Security Considerations

### Phone Number Validation

Add validation in your core bot:

```typescript
function validateWhatsAppNumber(number: string): boolean {
  // Format: whatsapp:+[country code][number]
  const regex = /^whatsapp:\+\d{10,15}$/;
  return regex.test(number);
}

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Before sending to approval gateway
if (agent.owner_whatsapp && !validateWhatsAppNumber(agent.owner_whatsapp)) {
  throw new Error('Invalid WhatsApp number format');
}
```

### Privacy

- Store phone numbers encrypted in your database
- Use environment variables for sensitive fallback numbers
- Log access to owner contact information
- Comply with GDPR/privacy regulations

## Troubleshooting

### Problem: Messages still going to wrong number

**Solution:** Check candidate payload includes correct `owner_whatsapp`:

```bash
# Debug: Print candidate before sending
console.log(JSON.stringify(candidate, null, 2));

# Verify owner_whatsapp field is set
# Should be: "owner_whatsapp": "whatsapp:+15551234567"
```

### Problem: Fallback not working

**Solution:** Ensure env vars are set:

```bash
# Check .env file
cat .env | grep OWNER_WA_NUMBER
cat .env | grep PHOTON_TO

# Should see:
# OWNER_WA_NUMBER=whatsapp:+15551234567
# PHOTON_TO=owner@example.com
```

### Problem: Format errors

**Solution:** Ensure correct formats:

```python
# ✅ Correct WhatsApp format
"owner_whatsapp": "whatsapp:+15551234567"

# ❌ Wrong formats
"owner_whatsapp": "+15551234567"        # Missing "whatsapp:" prefix
"owner_whatsapp": "15551234567"         # Missing + and prefix
"owner_whatsapp": "whatsapp:5551234567" # Missing country code +
```

## Migration Checklist

- [ ] Update your core bot to include `owner_whatsapp` and `owner_imessage` in candidate requests
- [ ] Update database schema to store owner contact info per brand/user
- [ ] Test with multiple phone numbers to verify routing
- [ ] Update environment variables (optional fallback)
- [ ] Add validation for phone number formats
- [ ] Update internal documentation for your team
- [ ] Test WhatsApp and iMessage approval flows
- [ ] Monitor logs for any routing issues

## Benefits

✅ **Multi-tenant support** - Each user gets their own approval prompts  
✅ **Scalable** - No hardcoded numbers  
✅ **Flexible** - Per-request or fallback defaults  
✅ **Backward compatible** - Existing code still works  
✅ **Secure** - No shared approval channels  

## Questions?

See the main [README.md](README.md) for general usage or [EXAMPLES.md](EXAMPLES.md) for API examples.

---

**Updated:** November 8, 2024  
**Version:** 0.2.0 (Multi-user support)

