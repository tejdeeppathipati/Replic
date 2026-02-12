# Services

This folder contains the non-Next.js services used by the Replic platform.

## Directory map

- `approval-gateway/` – human-in-the-loop approvals (WhatsApp / iMessage)
- `agent-orchestrator/` – LangGraph async agent workflow (HITL + tool calls)
- `auto-replier/` – monitoring + scoring + reply draft generation
- `daily-poster/` – scheduled posts + “post now” execution
- `llm-generator/` – shared LLM generation helpers
- `x-fetcher/` – X ingestion/polling
- `x-oauth/` – X OAuth helper
- `imessage-bridge/` – iMessage → webhook bridge (Node)
