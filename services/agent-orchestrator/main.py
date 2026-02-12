from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from supabase import create_client

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from tenacity import retry, stop_after_attempt, wait_exponential_jitter


class Settings(BaseSettings):
    port: int = 9000

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Approval gateway
    approval_gateway_url: str = "http://localhost:8000"
    approval_gateway_signing_secret: str = "change-me-in-production"
    decision_webhook_signing_secret: str = "change-me-in-production"

    # Next internal endpoints (Composio execution)
    next_internal_base_url: str = "http://localhost:3000"
    internal_service_secret: str = ""

    # Links in approval messages
    frontend_base_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RunRequest(BaseModel):
    brand_id: str = Field(..., description="brand_agent.id (UUID)")
    platforms: list[Literal["x", "reddit", "linkedin"]] = Field(
        default_factory=lambda: ["x"],
        description="Platforms to draft + post",
    )
    objective: str = Field(..., description="What we are trying to achieve")
    tone: str = Field(default="engaging", description="Desired voice/tone")
    persona: Literal["normal", "unhinged", "smart", "technical"] = Field(default="smart")
    require_approval: bool = Field(default=True, description="Gate posting behind HITL approval")


class RunResponse(BaseModel):
    run_id: str
    status: str


class DecisionPayload(BaseModel):
    id: str
    decision: Literal["approved", "edited", "rejected", "expired"]
    final_text: str | None = None
    decider: str
    latency_ms: int


class RunState(TypedDict, total=False):
    run_id: str
    brand_id: str
    brand: dict[str, Any]
    platforms: list[str]
    objective: str
    tone: str
    persona: str
    require_approval: bool

    drafts: dict[str, str]
    risk_flags: dict[str, list[str]]

    candidate_ids: dict[str, str]
    decisions: dict[str, dict[str, Any]]
    post_results: dict[str, dict[str, Any]]

    status: str
    error: str


@dataclass
class InMemoryRun:
    status: str
    state: RunState
    created_at: datetime
    updated_at: datetime


RUNS: dict[str, InMemoryRun] = {}
PENDING_DECISIONS: dict[str, asyncio.Future[DecisionPayload]] = {}


def get_supabase():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_llm() -> ChatOpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY must be set")
    return ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key, temperature=0.3)


async def try_persist_run(run_id: str, patch: dict[str, Any]) -> None:
    try:
        supabase = get_supabase()
        supabase.table("agent_runs").update({**patch, "updated_at": utcnow().isoformat()}).eq("id", run_id).execute()
    except Exception:
        return


async def try_insert_run(run_id: str, brand_id: str, user_id: str, initial_state: dict[str, Any]) -> None:
    try:
        supabase = get_supabase()
        supabase.table("agent_runs").insert(
            {
                "id": run_id,
                "brand_id": brand_id,
                "user_id": user_id,
                "status": "queued",
                "state": initial_state,
            }
        ).execute()
    except Exception:
        return


async def try_event(run_id: str, event_type: str, payload: dict[str, Any]) -> None:
    try:
        supabase = get_supabase()
        supabase.table("agent_events").insert(
            {"run_id": run_id, "event_type": event_type, "payload": payload}
        ).execute()
    except Exception:
        return


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=0.5, max=6))
async def fetch_brand(brand_id: str) -> dict[str, Any]:
    supabase = get_supabase()
    result = supabase.table("brand_agent").select("*").eq("id", brand_id).limit(1).execute()
    data = (result.data or [])
    if not data:
        raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")
    return data[0]


@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=0.5, max=6))
async def send_candidate(candidate: dict[str, Any]) -> None:
    url = f"{settings.approval_gateway_url.rstrip('/')}/candidate"
    headers = {"Authorization": f"Bearer {settings.approval_gateway_signing_secret}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=candidate, headers=headers)
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"approval-gateway error: {resp.status_code} {resp.text}")


@tool
async def composio_post_x(brand_id: str, text: str) -> dict[str, Any]:
    """Post to X (Twitter) via internal Next.js endpoint (Composio)."""
    url = f"{settings.next_internal_base_url.rstrip('/')}/api/internal/composio/post-tweet"
    headers = {"Authorization": f"Bearer {settings.internal_service_secret}"}
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(url, json={"brandId": brand_id, "text": text}, headers=headers)
        return {"status": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


@tool
async def composio_post_reddit(
    brand_id: str,
    subreddit: str,
    title: str,
    kind: str,
    text: str | None = None,
    url: str | None = None,
    flair_id: str | None = None,
) -> dict[str, Any]:
    """Post to Reddit via internal Next.js endpoint (Composio)."""
    endpoint = f"{settings.next_internal_base_url.rstrip('/')}/api/internal/composio/post-reddit"
    headers = {"Authorization": f"Bearer {settings.internal_service_secret}"}
    payload = {
        "brandId": brand_id,
        "subreddit": subreddit,
        "title": title,
        "kind": kind,
        "text": text,
        "url": url,
        "flair_id": flair_id,
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(endpoint, json=payload, headers=headers)
        return {"status": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


@tool
async def composio_post_linkedin(brand_id: str, text: str) -> dict[str, Any]:
    """Post to LinkedIn via internal Next.js endpoint (Composio)."""
    url = f"{settings.next_internal_base_url.rstrip('/')}/api/internal/composio/post-linkedin"
    headers = {"Authorization": f"Bearer {settings.internal_service_secret}"}
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(url, json={"brandId": brand_id, "text": text}, headers=headers)
        return {"status": resp.status_code, "json": resp.json() if resp.content else None, "text": resp.text}


async def node_load_brand(state: RunState) -> RunState:
    if state.get("brand"):
        return {}
    brand = await fetch_brand(state["brand_id"])
    return {"brand": brand}


async def node_generate_drafts(state: RunState) -> RunState:
    llm = get_llm()
    brand = state["brand"]
    brand_name = brand.get("brand_name") or brand.get("name") or "the brand"

    drafts: dict[str, str] = {}
    risk_flags: dict[str, list[str]] = {}

    for platform in state["platforms"]:
        sys = SystemMessage(
            content=(
                "You are a marketing agent. Generate a single draft post per platform.\n"
                "Be concise, compliant, and on-brand. No hashtags unless clearly relevant.\n"
                "Return only the draft text."
            )
        )
        user = HumanMessage(
            content=json.dumps(
                {
                    "brand": {
                        "name": brand_name,
                        "description": brand.get("description"),
                        "value_prop": brand.get("value_prop"),
                        "audience": brand.get("target_audience") or brand.get("audience"),
                        "tone": state.get("tone"),
                    },
                    "platform": platform,
                    "objective": state["objective"],
                    "constraints": {"x_max_chars": 280},
                }
            )
        )
        msg = await llm.ainvoke([sys, user])
        text = (msg.content or "").strip()

        if platform == "x" and len(text) > 280:
            text = text[:277] + "..."

        drafts[platform] = text

        flags: list[str] = []
        lowered = text.lower()
        if "guarantee" in lowered or "100%" in lowered:
            flags.append("overpromising")
        if "free" in lowered and "trial" not in lowered:
            flags.append("pricing_claim")
        risk_flags[platform] = flags

    return {"drafts": drafts, "risk_flags": risk_flags}


async def node_submit_for_approval(state: RunState) -> RunState:
    if not state.get("require_approval", True):
        return {"candidate_ids": {}}

    candidate_ids: dict[str, str] = {}
    brand = state["brand"]
    owner_whatsapp = brand.get("owner_whatsapp")
    owner_imessage = brand.get("owner_imessage")

    for platform, text in state["drafts"].items():
        candidate_id = f"ag_{state['run_id']}_{platform}"
        candidate_ids[platform] = candidate_id
        PENDING_DECISIONS[candidate_id] = asyncio.get_event_loop().create_future()

        candidate = {
            "id": candidate_id,
            "brand_id": state["brand_id"],
            "platform": platform,
            "source_ref": f"agent_run:{state['run_id']}",
            "proposed_text": text,
            "persona": state.get("persona", "smart"),
            "context_url": f"{settings.frontend_base_url.rstrip('/')}/dashboard?brandId={state['brand_id']}",
            "risk_flags": state.get("risk_flags", {}).get(platform, []),
            "deadline_sec": 900,
            "owner_whatsapp": owner_whatsapp,
            "owner_imessage": owner_imessage,
        }
        await send_candidate(candidate)

    return {"candidate_ids": candidate_ids}


async def node_wait_for_decisions(state: RunState) -> RunState:
    if not state.get("require_approval", True):
        return {"decisions": {}}

    decisions: dict[str, dict[str, Any]] = {}
    for platform, candidate_id in state.get("candidate_ids", {}).items():
        future = PENDING_DECISIONS.get(candidate_id)
        if not future:
            raise RuntimeError(f"Missing pending decision future for {candidate_id}")
        try:
            payload = await asyncio.wait_for(future, timeout=state.get("brand", {}).get("approval_timeout_sec", 1200))
        except asyncio.TimeoutError:
            payload = DecisionPayload(
                id=candidate_id,
                decision="expired",
                final_text=None,
                decider="system:timeout",
                latency_ms=0,
            )
        decisions[platform] = payload.model_dump()
    return {"decisions": decisions}


async def node_execute_tools(state: RunState) -> RunState:
    llm = get_llm().bind_tools([composio_post_x, composio_post_reddit, composio_post_linkedin])

    post_results: dict[str, dict[str, Any]] = {}
    for platform in state["platforms"]:
        draft = state["drafts"][platform]
        decision = (state.get("decisions") or {}).get(platform)

        if state.get("require_approval", True) and decision:
            if decision["decision"] in ("rejected", "expired"):
                post_results[platform] = {"skipped": True, "reason": decision["decision"]}
                continue
            final_text = decision.get("final_text") or draft
        else:
            final_text = draft

        if platform == "x":
            prompt = HumanMessage(
                content=f"Post this to X using the tool.\nbrand_id={state['brand_id']}\ntext={final_text}"
            )
        elif platform == "reddit":
            prompt = HumanMessage(
                content=(
                    "Create a Reddit self-post using the tool.\n"
                    f"brand_id={state['brand_id']}\nsubreddit=marketing\n"
                    f"title={state['objective'][:60]}\nkind=self\ntext={final_text}"
                )
            )
        elif platform == "linkedin":
            prompt = HumanMessage(
                content=f"Post this to LinkedIn using the tool.\nbrand_id={state['brand_id']}\ntext={final_text}"
            )
        else:
            post_results[platform] = {"skipped": True, "reason": "unsupported_platform"}
            continue

        msg = await llm.ainvoke([prompt])
        tool_calls = getattr(msg, "tool_calls", None) or []
        if not tool_calls:
            post_results[platform] = {"error": "model_did_not_call_tool", "model_output": msg.content}
            continue

        # Execute tool calls (take the first call for each platform)
        call = tool_calls[0]
        name = call["name"]
        args = call.get("args") or {}
        if name == "composio_post_x":
            post_results[platform] = await composio_post_x.ainvoke(args)
        elif name == "composio_post_reddit":
            post_results[platform] = await composio_post_reddit.ainvoke(args)
        elif name == "composio_post_linkedin":
            post_results[platform] = await composio_post_linkedin.ainvoke(args)
        else:
            post_results[platform] = {"error": "unknown_tool", "tool": name, "args": args}

    return {"post_results": post_results}


def build_graph():
    graph = StateGraph(RunState)
    graph.add_node("load_brand", node_load_brand)
    graph.add_node("generate_drafts", node_generate_drafts)
    graph.add_node("submit_for_approval", node_submit_for_approval)
    graph.add_node("wait_for_decisions", node_wait_for_decisions)
    graph.add_node("execute_tools", node_execute_tools)

    graph.set_entry_point("load_brand")
    graph.add_edge("load_brand", "generate_drafts")
    graph.add_edge("generate_drafts", "submit_for_approval")
    graph.add_edge("submit_for_approval", "wait_for_decisions")
    graph.add_edge("wait_for_decisions", "execute_tools")
    graph.add_edge("execute_tools", END)

    return graph.compile()


GRAPH = build_graph()


async def run_graph(run_id: str):
    run = RUNS[run_id]
    run.status = "running"
    run.updated_at = utcnow()
    run.state["status"] = "running"
    await try_persist_run(run_id, {"status": "running", "state": run.state})
    await try_event(run_id, "run_started", {"platforms": run.state.get("platforms")})
    try:
        updated = await GRAPH.ainvoke(run.state)
        run.state.update(updated)
        run.status = "completed"
        run.state["status"] = "completed"
        run.updated_at = utcnow()
        await try_persist_run(run_id, {"status": "completed", "state": run.state})
        await try_event(run_id, "run_completed", {"post_results": run.state.get("post_results")})
    except Exception as e:
        run.status = "failed"
        run.state["status"] = "failed"
        run.state["error"] = str(e)
        run.updated_at = utcnow()
        await try_persist_run(run_id, {"status": "failed", "state": run.state})
        await try_event(run_id, "run_failed", {"error": str(e)})


app = FastAPI(title="Replic Agent Orchestrator", version="0.1.0")


@app.get("/")
async def root():
    return {"service": "agent-orchestrator", "status": "ok", "version": "0.1.0"}


@app.post("/runs", response_model=RunResponse)
async def create_run(payload: RunRequest):
    if not settings.internal_service_secret:
        raise HTTPException(status_code=500, detail="INTERNAL_SERVICE_SECRET must be set")

    run_id = uuid.uuid4().hex
    brand = await fetch_brand(payload.brand_id)
    user_id = brand.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="brand_agent.user_id missing")
    state: RunState = {
        "run_id": run_id,
        "brand_id": payload.brand_id,
        "brand": brand,
        "platforms": payload.platforms,
        "objective": payload.objective,
        "tone": payload.tone,
        "persona": payload.persona,
        "require_approval": payload.require_approval,
        "status": "queued",
    }
    RUNS[run_id] = InMemoryRun(status="queued", state=state, created_at=utcnow(), updated_at=utcnow())
    await try_insert_run(run_id, payload.brand_id, user_id, state)
    await try_event(run_id, "run_queued", {"objective": payload.objective})

    asyncio.create_task(run_graph(run_id))

    return RunResponse(run_id=run_id, status="queued")


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    run = RUNS.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "run_id": run_id,
        "status": run.status,
        "created_at": run.created_at.isoformat(),
        "updated_at": run.updated_at.isoformat(),
        "state": run.state,
    }


def verify_decision_signature(authorization: str | None) -> bool:
    # If no secret is configured, allow unsigned webhooks (dev-only).
    if not settings.decision_webhook_signing_secret:
        return True
    if not authorization:
        return False
    return authorization == f"Bearer {settings.decision_webhook_signing_secret}"


@app.post("/decisions")
async def receive_decision(decision: DecisionPayload, authorization: str | None = Header(None)):
    if not verify_decision_signature(authorization):
        raise HTTPException(status_code=401, detail="Invalid authorization")

    future = PENDING_DECISIONS.get(decision.id)
    if future and not future.done():
        future.set_result(decision)
        return {"status": "ok"}

    # idempotency / unknown candidate
    return {"status": "ignored"}
