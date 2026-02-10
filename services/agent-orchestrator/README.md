# Agent Orchestrator (LangGraph)

This service runs the async **human-in-the-loop** marketing agent workflow:

- generate platform-specific drafts (LLM),
- send candidates to `approval-gateway` for approvals/edits,
- post approved content to X/Reddit/LinkedIn via Composio tool execution,
- persist run state/events (optional; see `supabase_rls_policies.sql`).

## Endpoints

- `POST /runs` – start a run
- `GET /runs/{run_id}` – get run status/state
- `POST /decisions` – webhook receiver for approval decisions (called by `approval-gateway`)

## Environment

Required:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APPROVAL_GATEWAY_URL` (default: `http://localhost:8000`)
- `APPROVAL_GATEWAY_SIGNING_SECRET` (must match approval-gateway `WEBHOOK_SIGNING_SECRET`)
- `DECISION_WEBHOOK_SIGNING_SECRET` (must match approval-gateway `CORE_DECISION_WEBHOOK_SIGNING_SECRET`)
- `INTERNAL_SERVICE_SECRET` (must match Next `INTERNAL_SERVICE_SECRET`)

Optional:

- `FRONTEND_BASE_URL` (default: `http://localhost:3000`)
- `NEXT_INTERNAL_BASE_URL` (default: `http://localhost:3000`)
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

## Run locally

```bash
cd services/agent-orchestrator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

