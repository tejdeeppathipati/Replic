# X OAuth Service

OAuth 2.0 PKCE (Proof Key for Code Exchange) service for obtaining X API tokens.

## 🎯 Purpose

This service handles the OAuth flow for connecting brand X (Twitter) accounts to BrandPilot, allowing the system to:
- Read mentions and search tweets
- Post replies on behalf of the brand
- Manage OAuth tokens securely

## 🏗️ Architecture

```
1. Frontend → POST /x/connect
   ↓ Returns authorization URL
2. User visits URL → Grants access on X
   ↓ X redirects back
3. GET /x/callback → Exchanges code for tokens
   ↓ Stores in Supabase
4. Other services → GET /x/token/{brand_id}
   ↓ Returns valid access token (auto-refreshes if needed)
```

## 📋 Prerequisites

1. **X Developer Account**
   - Go to: https://developer.x.com/
   - Create a new app
   - Enable OAuth 2.0
   - Set callback URL: `http://localhost:8100/x/callback`

2. **Supabase Account**
   - Database should have `oauth_credential` table (already created)

## 🚀 Setup

### 1. Install Dependencies

```bash
cd x-oauth
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run the Service

```bash
python -m uvicorn app.main:app --reload --port 8100
```

Service will be available at: http://localhost:8100

## 📝 API Endpoints

### Health Check
```
GET /
```

### Start OAuth Flow
```
POST /x/connect
Body: {
  "brand_id": "brand-123",
  "redirect_after_success": "http://localhost:3000/dashboard"  # optional
}

Response: {
  "authorization_url": "https://twitter.com/i/oauth2/authorize?...",
  "state": "abc123..."
}
```

**Next Step:** Redirect user to `authorization_url`

### OAuth Callback
```
GET /x/callback?code=xxx&state=yyy
```

Called automatically by X after user grants access. Exchanges code for tokens and stores them.

### Get Token (with Auto-Refresh)
```
GET /x/token/{brand_id}

Response: {
  "brand_id": "brand-123",
  "access_token": "xxx",
  "expires_at": 1234567890,
  "scope": "tweet.read tweet.write...",
  "message": "Token retrieved successfully"
}
```

**Use this endpoint** in other services (fetcher, poster) to get valid tokens.

### Manual Token Refresh
```
POST /x/refresh/{brand_id}
```

Manually refresh an expired token (usually not needed as `/x/token` auto-refreshes).

### Disconnect Account
```
DELETE /x/disconnect/{brand_id}
```

Revoke tokens and remove from database.

## 🧪 Testing

### Test OAuth Flow

1. **Start the service:**
```bash
python -m uvicorn app.main:app --reload --port 8100
```

2. **Initiate OAuth flow:**
```bash
curl -X POST http://localhost:8100/x/connect \
  -H "Content-Type: application/json" \
  -d '{"brand_id": "test-brand"}'
```

3. **Visit the authorization URL** in your browser

4. **Grant access** on X

5. **Check that tokens were saved:**
```bash
curl http://localhost:8100/x/token/test-brand
```

## 🔐 Security Features

- **PKCE Flow**: More secure than traditional OAuth
- **State Parameter**: CSRF protection
- **Token Encryption**: Stored securely in Supabase
- **Auto-Refresh**: Prevents expired tokens
- **Scope Control**: Only request necessary permissions

## 📊 Token Lifecycle

```
1. User connects account → access_token (expires in 2 hours)
                        → refresh_token (long-lived)

2. Service requests token → Check if expired
                         → If expired: auto-refresh
                         → Return valid token

3. Token nearing expiry → Auto-refresh (5 min buffer)

4. User disconnects → Revoke both tokens
                   → Remove from database
```

## 🔗 Integration with Other Services

### X Fetcher Service
```python
# Get token before making X API calls
response = await httpx.get(f"http://localhost:8100/x/token/{brand_id}")
token = response.json()["access_token"]

# Use token in X API request
headers = {"Authorization": f"Bearer {token}"}
```

### X Poster Service
```python
# Same pattern - get token before posting
token_response = await get_token(brand_id)
await post_tweet(token_response["access_token"], text)
```

## ⚠️ Important Notes

1. **Tokens Expire**: Access tokens expire in ~2 hours. Always use `/x/token` endpoint which auto-refreshes.

2. **Refresh Tokens**: Long-lived but can be revoked by user. Handle 401 errors gracefully.

3. **Rate Limits**: Token refresh has limits. Don't refresh unnecessarily.

4. **User Context**: These tokens are for **user context** (posting on behalf of brand). Different from app-only tokens.

## 🐛 Troubleshooting

### "Invalid client_id"
- Check `X_CLIENT_ID` in `.env`
- Verify app exists in X Developer Portal

### "Redirect URI mismatch"
- Callback URL in X app settings must match `X_REDIRECT_URI`
- Include `http://` or `https://`

### "Database connection failed"
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify `oauth_credential` table exists

### "Token expired"
- Normal! Service auto-refreshes
- If refresh fails, user needs to re-connect

## 📚 Resources

- **X OAuth 2.0 Docs**: https://developer.x.com/en/docs/authentication/oauth-2-0
- **PKCE Spec**: https://oauth.net/2/pkce/
- **X Developer Portal**: https://developer.x.com/en/portal/dashboard

## 🎉 Next Steps

Once this service is running:
1. ✅ Phase 1 complete!
2. → Move to Phase 2: X Fetcher Service
3. → Use this service to get tokens for API calls

