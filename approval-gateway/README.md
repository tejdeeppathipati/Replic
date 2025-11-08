# BrandPilot Approval Gateway 🤖

A Python microservice for handling human approval of social media replies via WhatsApp and iMessage. Part of the BrandPilot AI agent system.

## Overview

The Approval Gateway receives candidate replies from the core BrandPilot bot, prompts humans for approval via WhatsApp (Twilio) or iMessage (Photon iMessage Kit), and returns decisions (approved/edited/rejected) back to the core service.

### Key Features

- ✅ **WhatsApp approval** via Twilio interactive messages
- ✅ **iMessage approval** via Photon iMessage Kit sidecar
- ✅ **Rate limiting** with Redis token buckets
- ✅ **Idempotency** to prevent duplicate prompts
- ✅ **Timeout handling** for expired candidates
- ✅ **Activity logging** for audit trails
- ✅ **Simple command interface** (approve/edit/skip)

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌──────────┐
│ Core Bot    │────────▶│ Approval Gateway │────────▶│ WhatsApp │
│ (Next.js)   │         │   (FastAPI)      │         │ (Twilio) │
└─────────────┘         └──────────────────┘         └──────────┘
                               │                            │
                               │                            ▼
                               │                      ┌──────────┐
                               │                      │  Human   │
                               │                      │  Owner   │
                               │                      └──────────┘
                               │                            │
                               ▼                            │
                         ┌──────────┐                       │
                         │  Redis   │                       │
                         │  Store   │◀──────────────────────┘
                         └──────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Redis 7+
- Twilio account (for WhatsApp)
- Photon iMessage Kit (optional, for iMessage)

### Installation

```bash
# Clone and navigate
cd approval-gateway

# Install dependencies
make install

# Or manually:
pip install -r requirements.txt
```

### Configuration

```bash
# Copy example config
cp env.example .env

# Edit .env with your credentials
```

**Required environment variables:**

```bash
# Server
PORT=8080

# Redis
REDIS_URL=redis://localhost:6379/0

# Core webhook (where decisions are sent)
CORE_DECISION_WEBHOOK=http://localhost:9000/decisions

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WA_NUMBER=whatsapp:+14155238886
OWNER_WA_NUMBER=whatsapp:+15551234567

# Photon iMessage Kit (optional)
PHOTON_BASE_URL=http://localhost:5173
PHOTON_TO=owner@icloud.com

# Security
WEBHOOK_SIGNING_SECRET=your-secret-key-here
```

### Running

```bash
# Start Redis (if not already running)
make docker-redis

# Run the server
make run

# Server will start on http://localhost:8080
```

## API Endpoints

### POST /candidate

Receive a candidate reply for approval.

**Request:**

```bash
curl -X POST http://localhost:8080/candidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key-here" \
  -d '{
    "id": "cr_8f9a1b2c",
    "brand_id": "b_acme",
    "platform": "x",
    "source_ref": "1234567890",
    "proposed_text": "Great question! Check our docs at acme.co/sso",
    "persona": "smart",
    "context_url": "https://twitter.com/user/status/1234567890",
    "risk_flags": [],
    "deadline_sec": 900
  }'
```

**Response:**

```json
{
  "status": "prompted",
  "candidate_id": "cr_8f9a1b2c",
  "channels": ["whatsapp", "imessage"]
}
```

### POST /webhooks/whatsapp

Handle incoming WhatsApp messages from Twilio.

**Twilio configuration:**
- Set webhook URL: `https://your-domain.com/webhooks/whatsapp`
- Method: POST
- Message comes in → validates signature → processes command → returns decision

### POST /webhooks/imessage

Handle incoming iMessage messages from Photon Kit.

**Expected payload:**

```json
{
  "from": "user@icloud.com",
  "text": "approve cr_8f9a1b2c"
}
```

### GET /activity

Retrieve recent activity for a brand.

**Request:**

```bash
curl "http://localhost:8080/activity?brand_id=b_acme&limit=50"
```

**Response:**

```json
{
  "brand_id": "b_acme",
  "count": 3,
  "activities": [
    {
      "id": "cr_123",
      "brand_id": "b_acme",
      "platform": "x",
      "proposed_text": "Great question!",
      "state": "approved",
      "decision": "approved",
      "decider": "whatsapp:+15551234567",
      "latency_ms": 45230
    }
  ]
}
```

## Approval Commands

### WhatsApp Commands

Send these as text messages in WhatsApp:

```
# Approve a reply
approve cr_8f9a1b2c

# Edit a reply
edit cr_8f9a1b2c: This is the new text I want to post

# Skip a reply
skip cr_8f9a1b2c
```

### iMessage Commands

Same format as WhatsApp:

```
approve cr_8f9a1b2c
edit cr_8f9a1b2c: Modified reply text here
skip cr_8f9a1b2c
```

## Testing

### Run Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run linter
make lint

# Format code
make format
```

### Seed Demo Candidates

```bash
# Send one demo candidate
make seed

# Send multiple candidates
make seed-multi

# Or manually:
python tools/seed_candidate.py --url http://localhost:8080 --count 3
```

**After seeding**, check your WhatsApp/iMessage for approval prompts!

## Rate Limiting

The gateway uses Redis-backed token buckets for rate limiting:

- **Per-brand WhatsApp prompts**: 5 capacity, refills 1/min
- **Per-brand iMessage prompts**: 5 capacity, refills 1/min
- **Minimum spacing**: 20 seconds between prompts per brand

Configure in `.env`:

```bash
WA_BUCKET_CAPACITY=5
WA_BUCKET_REFILL_PER_MIN=1
MIN_SPACING_SEC=20
```

## Data Contracts

### Candidate (from core → gateway)

```python
{
  "id": "cr_...",              # Unique candidate ID
  "brand_id": "b_...",         # Brand identifier
  "platform": "x|reddit",      # Platform
  "source_ref": "...",         # Tweet/post ID
  "proposed_text": "...",      # Generated reply (<= 200 chars)
  "persona": "normal|smart|technical|unhinged",
  "context_url": "...",        # Link to original post
  "risk_flags": [],            # Optional risk warnings
  "deadline_sec": 900          # Seconds until auto-expire
}
```

### Decision (gateway → core)

```python
{
  "id": "cr_...",              # Candidate ID
  "decision": "approved|edited|rejected|expired",
  "final_text": "...",         # Text to post (if approved/edited)
  "decider": "...",            # Who decided (whatsapp:+1... or imessage:...)
  "latency_ms": 45230          # Time from prompt to decision
}
```

## Project Structure

```
approval-gateway/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── models.py            # Pydantic schemas
│   ├── config.py            # Settings management
│   ├── redis_store.py       # Redis client & state
│   ├── rate_limit.py        # Token bucket limiter
│   ├── whatsapp.py          # Twilio integration
│   └── imessage.py          # Photon Kit client
├── tests/
│   ├── test_whatsapp.py
│   ├── test_imessage.py
│   └── test_rate_limit.py
├── tools/
│   └── seed_candidate.py    # Demo data seeder
├── requirements.txt
├── Makefile
├── env.example
└── README.md
```

## Production Deployment

### Environment Checklist

- [ ] Set strong `WEBHOOK_SIGNING_SECRET`
- [ ] Use production Redis (managed service or replica)
- [ ] Configure Twilio webhook with HTTPS URL
- [ ] Set proper CORS if needed
- [ ] Enable logging/monitoring
- [ ] Set up SSL/TLS termination

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Railway/Render/Fly.io

1. Connect your GitHub repo
2. Set environment variables
3. Deploy!

Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Troubleshooting

### WhatsApp messages not sending

- Check Twilio credentials in `.env`
- Verify `TWILIO_WA_NUMBER` is WhatsApp-enabled
- Check Twilio console logs

### iMessage not working

- Ensure Photon iMessage Kit sidecar is running
- Verify `PHOTON_BASE_URL` is correct
- Check sidecar logs

### Redis connection errors

- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Verify firewall/network settings

### Rate limit issues

- Check token bucket settings
- View Redis keys: `redis-cli keys "bucket:*"`
- Adjust capacity/refill rates in `.env`

## Development

### Setup Development Environment

```bash
make dev
```

### Run in Development Mode

```bash
# With auto-reload
make run

# Or manually:
uvicorn app.main:app --reload --port 8080
```

### Code Quality

```bash
# Format code
make format

# Run linter
make lint

# Type checking
make typecheck

# All checks
make format lint typecheck test
```

## Security

- **Webhook signatures**: All inbound webhooks verify signatures
- **Authorization header**: `/candidate` endpoint requires Bearer token
- **Idempotency**: Redis-based deduplication prevents replays
- **Input validation**: Pydantic models validate all inputs
- **Rate limiting**: Token buckets prevent abuse

## License

MIT

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check existing docs in `/docs`
- Review test cases in `/tests`

## Roadmap

- [ ] Support for Slack approval flow
- [ ] Web dashboard for viewing activity
- [ ] Webhook retry mechanism with exponential backoff
- [ ] Multi-brand support with separate owner numbers
- [ ] Analytics and metrics (Prometheus/Grafana)
- [ ] A/B testing for different reply styles

---

**Built with ❤️ for the BrandPilot project**

