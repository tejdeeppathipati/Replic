# Replic Approval Gateway

FastAPI service that routes candidate replies to humans for approval (WhatsApp + iMessage) and forwards the final decision back to the core service.

## Quick start

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
make test
make run
```

## Environment

Common variables:

- `WEBHOOK_SIGNING_SECRET` (required): `Authorization: Bearer ...` secret for `POST /candidate`
- `CORE_DECISION_WEBHOOK` (required): core service URL to receive decisions (e.g. agent-orchestrator `http://localhost:9000/decisions`)
- `CORE_DECISION_WEBHOOK_SIGNING_SECRET` (optional): if set, approval-gateway signs decisions with `Authorization: Bearer ...`
- `FRONTEND_BASE_URL` (optional): Next.js base URL for internal Composio execution (default `http://localhost:3000`)
- `INTERNAL_SERVICE_SECRET` (optional): required if using `FRONTEND_BASE_URL/api/internal/composio/*`
- `REDIS_URL` (optional): defaults to `redis://localhost:6379/0`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (optional): WhatsApp sending
- `IMESSAGE_SIDECAR_URL` (optional): Photon iMessage Kit sidecar base URL
