# Replic

LLM-based marketing agent platform with a Next.js dashboard + a set of background services for:
- generating content (posts + replies),
- routing risky actions through human approval (WhatsApp / iMessage),
- executing actions on X/Reddit via tool calling (Composio),
- executing actions on X/Reddit/LinkedIn via tool calling (Composio),
- storing multi-tenant state in Postgres (Supabase) with RLS.

## Repository layout

### Web app (this repo root)
- `app/` – Next.js App Router pages + API routes
- `components/` – UI + dashboard components
- `lib/` – shared TS utilities (Supabase, auth, Composio, etc.)
- `middleware.ts` – auth middleware (protects dashboard + API routes)
- `supabase_rls_policies.sql` – database RLS policies (run in Supabase)
- `supabase_agent_schema.sql` – agent runs + Postgres rate limiter (optional, run in Supabase)

### Services
All non-Next services live under:
- `services/approval-gateway/` – FastAPI human-in-the-loop approval service
- `services/agent-orchestrator/` – LangGraph agent workflow (async + HITL approvals)
- `services/auto-replier/` – monitors tweets, scores relevance, generates replies
- `services/daily-poster/` – generates scheduled posts and/or posts actions now
- `services/llm-generator/` – shared LLM generation helpers (Python)
- `services/x-fetcher/` – X polling / ingestion service
- `services/x-oauth/` – X OAuth helper service
- `services/imessage-bridge/` – Node service bridging iMessage → webhook

### Tools
- `tools/` – one-off utilities (local/dev)

## Local development

### Web
```bash
npm install
npm run dev
```
Note: Next.js 16 requires Node `>=20.9.0` (see `package.json` `engines` / `.nvmrc`).

### Services
Each service is self-contained (see its own README / requirements).
Example:
```bash
cd services/approval-gateway
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
make test
make run
```

## Architecture (high level)

### A) Login → dashboard
1. Client signs in via Supabase Auth.
2. Web app registers an httpOnly session cookie via `/api/auth/register-session`.
3. `middleware.ts` enforces auth for `/dashboard/*` and protected `/api/*`.

### B) Generate + post “action”
1. User creates an action in the dashboard.
2. API verifies brand ownership.
3. API calls `services/daily-poster/` to generate and post.
4. Persist results to Postgres.

### C) Auto-replies
1. API calls `services/auto-replier/` to monitor + score.
2. Draft is generated and presented in the dashboard.
3. If configured, route through `services/approval-gateway/` for human approval.

### D) Human-in-the-loop approvals
1. A candidate reply is sent to WhatsApp/iMessage.
2. Human approves/edits/skips.
3. Decision is forwarded back to the core flow and executed.

## Security (important)
- Make sure Supabase RLS policies are enabled by running `supabase_rls_policies.sql`.
- If you want the LangGraph agent run history + Postgres rate limiting, run `supabase_agent_schema.sql`.
- All brand-scoped API routes must enforce ownership checks (server-side), not just UI filtering.
