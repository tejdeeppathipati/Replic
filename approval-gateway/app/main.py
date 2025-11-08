"""
BrandPilot Approval Gateway - FastAPI application.

Handles human approval of candidate social media replies via WhatsApp and iMessage.
"""

import time
import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header
from fastapi.responses import JSONResponse
import httpx

from app.config import settings
from app.models import Candidate, Decision, ActivityEntry, CandidateState
from app.redis_store import init_store, close_store, get_store
from app.rate_limit import init_rate_limiter, get_rate_limiter
from app.whatsapp import (
    init_whatsapp_client,
    get_whatsapp_client,
    parse_whatsapp_command
)
from app.imessage import (
    init_imessage_client,
    get_imessage_client,
    parse_imessage_command
)


# Background task for checking timeouts
timeout_checker_task: Optional[asyncio.Task] = None


async def check_timeouts():
    """Background worker that checks for expired candidates."""
    while True:
        try:
            store = get_store()
            expired = await store.get_expired_candidates()
            
            for state in expired:
                # Mark as expired
                await store.update_state(state.candidate.id, "expired")
                
                # Send decision to core
                elapsed_ms = int(
                    (datetime.now(timezone.utc) - state.created_at).total_seconds() * 1000
                )
                
                decision = Decision(
                    id=state.candidate.id,
                    decision="expired",
                    final_text=None,
                    decider="system:timeout",
                    latency_ms=elapsed_ms
                )
                
                await send_decision_to_core(decision)
                
                # Log activity
                activity = ActivityEntry(
                    id=state.candidate.id,
                    brand_id=state.candidate.brand_id,
                    platform=state.candidate.platform,
                    proposed_text=state.candidate.proposed_text,
                    state="expired",
                    created_at=state.created_at,
                    decided_at=datetime.now(timezone.utc),
                    decision="expired",
                    final_text=None,
                    decider="system:timeout",
                    latency_ms=elapsed_ms
                )
                
                await store.log_activity(state.candidate.brand_id, activity)
            
            # Check every 10 seconds
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"Error in timeout checker: {e}")
            await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global timeout_checker_task
    
    # Startup
    print("🚀 Starting BrandPilot Approval Gateway...")
    
    # Initialize Redis store
    await init_store(settings.redis_url)
    
    # Initialize rate limiter
    redis_client = get_store().client
    init_rate_limiter(redis_client)
    
    # Initialize WhatsApp client
    if settings.twilio_account_sid and settings.twilio_auth_token:
        init_whatsapp_client(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
            settings.twilio_wa_number,
            settings.owner_wa_number
        )
        print("WhatsApp client initialized")
    else:
        print("WhatsApp client not configured")
    
    # Initialize iMessage client
    if settings.photon_base_url and settings.photon_to:
        init_imessage_client(
            settings.photon_base_url,
            settings.photon_to
        )
        print("iMessage client initialized")
    else:
        print("iMessage client not configured")
    
    # Start timeout checker
    timeout_checker_task = asyncio.create_task(check_timeouts())
    print("Timeout checker started")
    
    print(f"Server ready on port {settings.port}")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    
    # Stop timeout checker
    if timeout_checker_task:
        timeout_checker_task.cancel()
        try:
            await timeout_checker_task
        except asyncio.CancelledError:
            pass
    
    # Close connections
    await close_store()
    
    try:
        imsg_client = get_imessage_client()
        await imsg_client.close()
    except:
        pass
    
    print("Goodbye!")


app = FastAPI(
    title="BrandPilot Approval Gateway",
    description="Human approval service for social media replies",
    version="0.1.0",
    lifespan=lifespan
)


async def send_decision_to_core(decision: Decision) -> None:
    """
    Send a decision back to the core service.
    
    Args:
        decision: Decision to send
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.core_decision_webhook,
                json=decision.model_dump()
            )
            response.raise_for_status()
    except httpx.HTTPError as e:
        print(f"Failed to send decision to core: {e}")
        # In production, you'd want to retry with exponential backoff


def verify_webhook_signature(signature: Optional[str]) -> bool:
    """Verify webhook signing secret."""
    if not signature:
        return False
    return signature == f"Bearer {settings.webhook_signing_secret}"


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "brandpilot-approval-gateway",
        "status": "ok",
        "version": "0.1.0"
    }


@app.post("/candidate", status_code=202)
async def receive_candidate(
    candidate: Candidate,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None)
):
    """
    Receive a candidate reply for approval.
    
    This endpoint validates idempotency, enforces rate limits,
    and sends approval prompts via WhatsApp and iMessage.
    """
    # Verify signature
    if not verify_webhook_signature(authorization):
        raise HTTPException(status_code=401, detail="Invalid authorization")
    
    store = get_store()
    rate_limiter = get_rate_limiter()
    
    # Check idempotency
    if await store.is_duplicate(candidate.id):
        return {"status": "duplicate", "candidate_id": candidate.id}
    
    # Create initial state
    state = CandidateState(
        candidate=candidate,
        state="new",
        created_at=datetime.now(timezone.utc)
    )
    
    await store.save_candidate_state(state)
    
    # Check rate limits
    can_send_wa = await rate_limiter.can_send_wa_prompt(
        candidate.brand_id,
        settings.wa_bucket_capacity,
        settings.wa_bucket_refill_per_min
    )
    
    can_send_imsg = await rate_limiter.can_send_imsg_prompt(
        candidate.brand_id,
        settings.imsg_bucket_capacity,
        settings.imsg_bucket_refill_per_min
    )
    
    # Enforce spacing
    can_send_wa = can_send_wa and await rate_limiter.enforce_spacing(
        f"wa:{candidate.brand_id}",
        settings.min_spacing_sec
    )
    
    can_send_imsg = can_send_imsg and await rate_limiter.enforce_spacing(
        f"imsg:{candidate.brand_id}",
        settings.min_spacing_sec
    )
    
    # Send prompts
    sent_channels = []
    
    if can_send_wa:
        try:
            wa_client = get_whatsapp_client()
            wa_client.send_approval_prompt(candidate)
            sent_channels.append("whatsapp")
        except Exception as e:
            print(f"Failed to send WhatsApp prompt: {e}")
    
    if can_send_imsg:
        try:
            imsg_client = get_imessage_client()
            await imsg_client.send_approval_prompt(candidate)
            sent_channels.append("imessage")
        except Exception as e:
            print(f"Failed to send iMessage prompt: {e}")
    
    if sent_channels:
        # Update state to prompted
        await store.update_state(candidate.id, "prompted")
        
        return {
            "status": "prompted",
            "candidate_id": candidate.id,
            "channels": sent_channels
        }
    else:
        return {
            "status": "rate_limited",
            "candidate_id": candidate.id,
            "message": "Rate limit exceeded, candidate queued"
        }


@app.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Handle incoming WhatsApp messages from Twilio.
    
    Processes approval commands (approve/edit/skip) and sends
    decisions back to the core service.
    """
    form_data = await request.form()
    params = dict(form_data)
    
    # Validate Twilio signature
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    
    try:
        wa_client = get_whatsapp_client()
        if not wa_client.validate_webhook(url, params, signature):
            raise HTTPException(status_code=403, detail="Invalid signature")
    except RuntimeError:
        # WhatsApp client not initialized, skip validation in dev
        print("⚠️  WhatsApp signature validation skipped (client not configured)")
    
    # Extract message text
    message_body = params.get("Body", "").strip()
    from_number = params.get("From", "")
    
    # Parse command
    command = parse_whatsapp_command(message_body)
    
    if not command:
        return {"status": "ignored", "reason": "Invalid command format"}
    
    candidate_id = command["candidate_id"]
    action = command["action"]
    edited_text = command["edited_text"]
    
    # Get candidate state
    store = get_store()
    state = await store.get_candidate_state(candidate_id)
    
    if not state:
        return {"status": "error", "reason": "Candidate not found"}
    
    if state.state not in ["new", "prompted"]:
        return {"status": "error", "reason": f"Candidate already {state.state}"}
    
    # Update state
    await store.update_state(candidate_id, action, decider=from_number)
    
    # Calculate latency
    latency_ms = int(
        (datetime.now(timezone.utc) - state.created_at).total_seconds() * 1000
    )
    
    # Determine final text
    final_text = edited_text if action == "edited" else state.candidate.proposed_text
    if action == "rejected":
        final_text = None
    
    # Create decision
    decision = Decision(
        id=candidate_id,
        decision=action,
        final_text=final_text,
        decider=from_number,
        latency_ms=latency_ms
    )
    
    # Send to core
    await send_decision_to_core(decision)
    
    # Log activity
    activity = ActivityEntry(
        id=candidate_id,
        brand_id=state.candidate.brand_id,
        platform=state.candidate.platform,
        proposed_text=state.candidate.proposed_text,
        state=action,
        created_at=state.created_at,
        decided_at=datetime.now(timezone.utc),
        decision=action,
        final_text=final_text,
        decider=from_number,
        latency_ms=latency_ms
    )
    
    await store.log_activity(state.candidate.brand_id, activity)
    
    return {"status": "processed", "decision": action}


@app.post("/webhooks/imessage")
async def imessage_webhook(request: Request):
    """
    Handle incoming iMessage messages from Photon iMessage Kit.
    
    Processes approval commands (approve/edit/skip) and sends
    decisions back to the core service.
    """
    try:
        payload = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Extract message details
    from_user = payload.get("from", "")
    message_text = payload.get("text", "").strip()
    
    # Parse command
    command = parse_imessage_command(message_text)
    
    if not command:
        return {"status": "ignored", "reason": "Invalid command format"}
    
    candidate_id = command["candidate_id"]
    action = command["action"]
    edited_text = command["edited_text"]
    
    # Get candidate state
    store = get_store()
    state = await store.get_candidate_state(candidate_id)
    
    if not state:
        return {"status": "error", "reason": "Candidate not found"}
    
    if state.state not in ["new", "prompted"]:
        return {"status": "error", "reason": f"Candidate already {state.state}"}
    
    # Update state
    decider = f"imessage:{from_user}"
    await store.update_state(candidate_id, action, decider=decider)
    
    # Calculate latency
    latency_ms = int(
        (datetime.now(timezone.utc) - state.created_at).total_seconds() * 1000
    )
    
    # Determine final text
    final_text = edited_text if action == "edited" else state.candidate.proposed_text
    if action == "rejected":
        final_text = None
    
    # Create decision
    decision = Decision(
        id=candidate_id,
        decision=action,
        final_text=final_text,
        decider=decider,
        latency_ms=latency_ms
    )
    
    # Send to core
    await send_decision_to_core(decision)
    
    # Log activity
    activity = ActivityEntry(
        id=candidate_id,
        brand_id=state.candidate.brand_id,
        platform=state.candidate.platform,
        proposed_text=state.candidate.proposed_text,
        state=action,
        created_at=state.created_at,
        decided_at=datetime.now(timezone.utc),
        decision=action,
        final_text=final_text,
        decider=decider,
        latency_ms=latency_ms
    )
    
    await store.log_activity(state.candidate.brand_id, activity)
    
    return {"status": "processed", "decision": action}


@app.get("/activity")
async def get_activity(brand_id: str, limit: int = 50):
    """
    Retrieve recent activity for a brand.
    
    Args:
        brand_id: Brand identifier
        limit: Maximum number of entries (default 50, max 100)
    """
    if limit > 100:
        limit = 100
    
    store = get_store()
    activities = await store.get_activity(brand_id, limit)
    
    return {
        "brand_id": brand_id,
        "count": len(activities),
        "activities": [a.model_dump() for a in activities]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

