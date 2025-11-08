# Changes in v0.2.0 - Multi-User Support

## Summary

Upgraded the approval gateway to support **dynamic phone numbers per candidate** instead of a single hardcoded number. This enables multi-user/multi-tenant scenarios where each brand owner can receive approval prompts on their own phone.

## What Changed

### 1. Data Model Updates

**File: `app/models.py`**

Added two new optional fields to the `Candidate` model:

```python
owner_whatsapp: str | None = Field(None, description="Owner's WhatsApp number")
owner_imessage: str | None = Field(None, description="Owner's iMessage email or phone")
```

- Both fields are **optional** (backward compatible)
- If provided: sends to specified contact
- If omitted: uses environment fallback

### 2. WhatsApp Client Updates

**File: `app/whatsapp.py`**

**Changed:**
- `__init__()` - Removed `to_number` parameter (no longer hardcoded)
- `send_approval_prompt()` - Added `to_number: str` parameter (passed per call)
- `init_whatsapp_client()` - Removed `to_number` parameter

**Before:**
```python
wa_client.send_approval_prompt(candidate)
```

**After:**
```python
wa_client.send_approval_prompt(candidate, "whatsapp:+15551234567")
```

### 3. iMessage Client Updates

**File: `app/imessage.py`**

**Changed:**
- `__init__()` - Removed `recipient` parameter
- `send_approval_prompt()` - Added `recipient: str` parameter
- `init_imessage_client()` - Removed `recipient` parameter

**Before:**
```python
await imsg_client.send_approval_prompt(candidate)
```

**After:**
```python
await imsg_client.send_approval_prompt(candidate, "user@example.com")
```

### 4. Main Application Logic

**File: `app/main.py`**

**Startup changes:**
```python
# Before
init_whatsapp_client(sid, token, from_number, to_number)
init_imessage_client(base_url, recipient)

# After
init_whatsapp_client(sid, token, from_number)
init_imessage_client(base_url)
```

**Send prompt changes:**
```python
# NEW: Check candidate for owner contact, with fallback to env
if can_send_wa and candidate.owner_whatsapp:
    wa_client.send_approval_prompt(candidate, candidate.owner_whatsapp)
elif can_send_wa and settings.owner_wa_number:
    wa_client.send_approval_prompt(candidate, settings.owner_wa_number)

if can_send_imsg and candidate.owner_imessage:
    await imsg_client.send_approval_prompt(candidate, candidate.owner_imessage)
elif can_send_imsg and settings.photon_to:
    await imsg_client.send_approval_prompt(candidate, settings.photon_to)
```

### 5. Configuration Updates

**File: `app/config.py`**

Updated comments to clarify fallback behavior:

```python
owner_wa_number: str = ""  # Fallback default if candidate.owner_whatsapp not provided
photon_to: str = ""        # Fallback default if candidate.owner_imessage not provided
```

### 6. Tools & Scripts

**File: `tools/seed_candidate.py`**

Updated demo candidates to include new fields:

```python
candidate = {
    # ... existing fields
    "owner_whatsapp": None,  # Set to override env default
    "owner_imessage": None   # Set to override env default
}
```

### 7. Documentation

**New file: `MULTI_USER_GUIDE.md`**

Comprehensive guide covering:
- Migration from single to multi-user
- API usage examples
- Integration patterns
- Testing strategies
- Troubleshooting

## Breaking Changes

### ⚠️ Minor Breaking Change

If you were **directly importing and calling** the WhatsApp or iMessage client functions:

**Before:**
```python
from app.whatsapp import init_whatsapp_client

# This will now fail (wrong number of arguments)
init_whatsapp_client(sid, token, from_number, to_number)
```

**After:**
```python
from app.whatsapp import init_whatsapp_client

# Updated signature
init_whatsapp_client(sid, token, from_number)
```

**Mitigation:** The main application handles this automatically. Only affects direct imports.

## Backward Compatibility

✅ **Fully backward compatible** for API consumers:

- Existing candidate requests **without** `owner_whatsapp`/`owner_imessage` still work
- Fallback to environment variables (`OWNER_WA_NUMBER`, `PHOTON_TO`)
- No changes required to existing integrations
- Can gradually migrate to per-candidate contacts

## Migration Path

### For Existing Deployments

**Option 1: No Changes (Keep Single User)**
```bash
# Keep using env vars - works as before
OWNER_WA_NUMBER=whatsapp:+15551234567
PHOTON_TO=owner@example.com
```

**Option 2: Gradual Migration (Add Per-User)**
```python
# Start including owner info in new requests
candidate = {
    # ... existing fields
    "owner_whatsapp": user.whatsapp_number,  # NEW
    "owner_imessage": user.email             # NEW
}
```

### For New Deployments

Include owner contact in every request:

```typescript
// Your core bot
const candidate = {
  id: generateId(),
  brand_id: agent.id,
  // ... other fields
  owner_whatsapp: agent.owner_whatsapp,  // ✅ Always include
  owner_imessage: agent.owner_imessage    // ✅ Always include
};
```

## Testing

All changes have been verified:

✅ Python syntax check passed  
✅ Model validation works  
✅ WhatsApp client accepts dynamic numbers  
✅ iMessage client accepts dynamic recipients  
✅ Fallback to env vars works  
✅ Seed script updated  

## Example Usage

### Multi-User Scenario

```python
# User 1: Tejdeep in India
POST /candidate
{
  "id": "cr_tej_001",
  "brand_id": "b_tejdeep_startup",
  "owner_whatsapp": "whatsapp:+919876543210",
  "owner_imessage": "tejdeep@startup.com",
  // ...
}
# → Sends approval to Tejdeep's phone

# User 2: Alice in USA
POST /candidate
{
  "id": "cr_alice_001",
  "brand_id": "b_alice_company",
  "owner_whatsapp": "whatsapp:+14155551234",
  "owner_imessage": "alice@company.com",
  // ...
}
# → Sends approval to Alice's phone
```

## Benefits

✅ **Multi-tenant ready** - Each user gets their own prompts  
✅ **Scalable** - No single bottleneck number  
✅ **Secure** - No shared approval channels  
✅ **Flexible** - Can override per request  
✅ **Backward compatible** - Existing code works  

## Files Changed

- `app/models.py` - Added owner contact fields
- `app/whatsapp.py` - Dynamic to_number parameter
- `app/imessage.py` - Dynamic recipient parameter
- `app/main.py` - Updated logic for dynamic routing
- `app/config.py` - Documented fallback behavior
- `tools/seed_candidate.py` - Updated demo data
- `MULTI_USER_GUIDE.md` - New comprehensive guide
- `CHANGES_v0.2.0.md` - This file

## Next Steps

1. **Test in development**
   ```bash
   cd approval-gateway
   python tools/seed_candidate.py
   ```

2. **Update your core bot** to include owner contact fields

3. **Test with multiple numbers** to verify routing

4. **Deploy** when ready - backward compatible!

## Questions?

- See [MULTI_USER_GUIDE.md](MULTI_USER_GUIDE.md) for detailed usage
- See [README.md](README.md) for general setup
- See [EXAMPLES.md](EXAMPLES.md) for API examples

---

**Version:** 0.2.0  
**Released:** November 8, 2024  
**Author:** BrandPilot Team

