"""
Replic Approval Gateway - FastAPI application.

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
from app.ai_chat import (
    chat_with_ai,
    is_ai_chat_request,
    is_post_command,
    is_generate_and_post
)
from app.brand_lookup import get_brand_for_imessage
from app.post_approval import post_to_x


# Background task for checking timeouts
timeout_checker_task: Optional[asyncio.Task] = None
imessage_watch_task: Optional[asyncio.Task] = None
_last_watch_status: Optional[str] = None


async def ensure_imessage_watch():
    """Continuously ensure Photon is forwarding messages to our webhook."""
    global _last_watch_status

    if not settings.photon_base_url:
        return

    webhook_url = f"http://localhost:{settings.port}/webhooks/imessage"

    while True:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{settings.photon_base_url}/watch/start",
                    json={
                        "webhookUrl": webhook_url,
                        "webhookHeaders": {}
                    }
                )

            if response.status_code == 200:
                if _last_watch_status != "ok":
                    print(f"✅ iMessage watching active (webhook: {webhook_url})")
                _last_watch_status = "ok"
                await asyncio.sleep(60)
                continue

            status_note = f"status_{response.status_code}"
            if _last_watch_status != status_note:
                print(
                    f"⚠️  iMessage watch returned {response.status_code}: "
                    f"{await response.aread()}"
                )
            _last_watch_status = status_note
        except Exception as e:
            error_note = f"error:{e}"
            if _last_watch_status != error_note:
                print(f"⚠️  Could not ensure iMessage watch: {e}")
            _last_watch_status = error_note

        await asyncio.sleep(10)


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
    global timeout_checker_task, imessage_watch_task
    
    # Startup
    print("🚀 Starting Replic Approval Gateway...")
    
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
            settings.twilio_wa_number
        )
        print("WhatsApp client initialized")
    else:
        print("WhatsApp client not configured")
    
    # Initialize iMessage client
    if settings.photon_base_url:
        init_imessage_client(settings.photon_base_url)
        print("iMessage client initialized")
        imessage_watch_task = asyncio.create_task(ensure_imessage_watch())
    else:
        print("iMessage client not configured")
    
    # Start timeout checker
    timeout_checker_task = asyncio.create_task(check_timeouts())
    print("Timeout checker started")
    
    print(f"Server ready on port {settings.port}")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    
    # Stop background tasks
    for task in [timeout_checker_task, imessage_watch_task]:
        if task:
            task.cancel()
            try:
                await task
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
    title="Replic Approval Gateway",
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
        "service": "replic-approval-gateway",
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
    
    # Send WhatsApp prompt if configured and owner number provided
    if can_send_wa and candidate.owner_whatsapp:
        try:
            wa_client = get_whatsapp_client()
            wa_client.send_approval_prompt(candidate, candidate.owner_whatsapp)
            sent_channels.append("whatsapp")
        except Exception as e:
            print(f"Failed to send WhatsApp prompt: {e}")
    elif can_send_wa and not candidate.owner_whatsapp and settings.owner_wa_number:
        # Fallback to default owner number from env (for backward compatibility)
        try:
            wa_client = get_whatsapp_client()
            wa_client.send_approval_prompt(candidate, settings.owner_wa_number)
            sent_channels.append("whatsapp")
        except Exception as e:
            print(f"Failed to send WhatsApp prompt: {e}")
    
    # Send iMessage prompt if configured and owner address provided
    if can_send_imsg and candidate.owner_imessage:
        try:
            imsg_client = get_imessage_client()
            await imsg_client.send_approval_prompt(candidate, candidate.owner_imessage)
            sent_channels.append("imessage")
        except Exception as e:
            print(f"Failed to send iMessage prompt: {e}")
    elif can_send_imsg and not candidate.owner_imessage and settings.photon_to:
        # Fallback to default recipient from env (for backward compatibility)
        try:
            imsg_client = get_imessage_client()
            await imsg_client.send_approval_prompt(candidate, settings.photon_to)
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
    
    Processes:
    1. Approval commands (approve/edit/skip) - for pending approvals
    2. AI chat requests (generate post, help me, etc.) - for generating new content
    """
    try:
        payload = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Handle two possible payload formats:
    # 1. Direct format: {"from": "...", "text": "..."}
    # 2. Webhook format: {"event": "new_message", "message": {"sender": "...", "text": "..."}}
    if "event" in payload and "message" in payload:
        # Webhook format from iMessage bridge
        message_data = payload.get("message", {})
        from_user = message_data.get("sender", "")
        message_text = message_data.get("text", "").strip()
    else:
        # Direct format
        from_user = payload.get("from", "")
        message_text = payload.get("text", "").strip()
    
    print(f"📨 Received iMessage from {from_user}: {message_text}")
    print(f"   Full payload: {payload}")
    
    # First, try to parse as approval command
    command = parse_imessage_command(message_text)
    
    if command:
        # Handle approval command
        candidate_id = command["candidate_id"]
        action = command["action"]
        edited_text = command["edited_text"]
        
        # Get candidate state
        store = get_store()
        state = await store.get_candidate_state(candidate_id)
        
        if not state:
            # Not an approval command, might be AI chat
            pass
        elif state.state not in ["new", "prompted"]:
            return {"status": "error", "reason": f"Candidate already {state.state}"}
        else:
            # Process approval
            decider = f"imessage:{from_user}"
            await store.update_state(candidate_id, action, decider=decider)
            
            latency_ms = int(
                (datetime.now(timezone.utc) - state.created_at).total_seconds() * 1000
            )
            
            final_text = edited_text if action == "edited" else state.candidate.proposed_text
            if action == "rejected":
                final_text = None
            
            decision = Decision(
                id=candidate_id,
                decision=action,
                final_text=final_text,
                decider=decider,
                latency_ms=latency_ms
            )
            
            await send_decision_to_core(decision)
            
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
    
    # Check if it's "generate and post" FIRST (before checking post command)
    should_post = is_generate_and_post(message_text)
    
    # Check if it's a "post this" command (post last generated post)
    # BUT only if it's NOT a generate and post command
    if not should_post and is_post_command(message_text):
        store = get_store()
        last_post = await store.get_last_post(from_user)
        
        if not last_post:
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                "❌ No recent post found. Generate a post first with 'generate post about X'"
            )
            return {"status": "no_post", "message": "No last post found"}
        
        # Post the last generated post
        brand_id = last_post.get("brand_id")
        post_text = last_post.get("post_text")
        
        if not brand_id or not post_text:
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                "❌ Error: Invalid post data"
            )
            return {"status": "error", "reason": "Invalid post data"}
        
        try:
            # Use brand_id as userId for Composio (same as Activity Feed does)
            result = await post_to_x(brand_id, post_text)
            
            imsg_client = get_imessage_client()
            if result.get("success"):
                tweet_url = result.get("url", "Posted!")
                response_msg = f"✅ Posted to X!\n\n{post_text}\n\n🔗 {tweet_url}"
                print(f"📱 Sending iMessage response to {from_user}: {response_msg[:100]}...")
                await imsg_client.send_message(from_user, response_msg)
                print(f"✅ iMessage sent successfully")
                return {"status": "posted", "url": tweet_url}
            else:
                error = result.get("error", "Unknown error")
                await imsg_client.send_message(
                    from_user,
                    f"❌ Failed to post: {error}"
                )
                return {"status": "error", "reason": error}
        except Exception as e:
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                f"❌ Error posting: {str(e)}"
            )
            return {"status": "error", "reason": str(e)}
    
    # Not an approval command - check if it's an AI chat request
    # (should_post is already set above)
    if is_ai_chat_request(message_text) or should_post:
        print(f"🤖 Detected AI chat request: {message_text}")
        print(f"   Should post: {should_post}")
        
        # Get brand info for this iMessage ID
        print(f"🔍 Looking up brand for iMessage: {from_user}")
        brand_info = await get_brand_for_imessage(from_user)
        
        if not brand_info:
            print(f"❌ No brand found for {from_user}")
            # No brand found - send helpful message
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                "🤖 Hi! I can help you generate posts, but I need to know which brand.\n\n"
                "Make sure your brand has 'owner_imessage' set to your iMessage ID in the database.\n\n"
                "Or try: 'generate post about [topic]' and I'll use your first active brand."
            )
            return {"status": "no_brand", "message": "No brand found for iMessage ID"}
        
        print(f"✅ Brand found: {brand_info.get('brand_name') or brand_info.get('name')} (ID: {brand_info.get('id')})")
        
        # Chat with AI
        if not settings.xai_api_key:
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                "❌ AI chat not configured. Please set XAI_API_KEY in approval-gateway/.env"
            )
            return {"status": "error", "reason": "xAI API key not configured"}
        
        try:
            ai_response = await chat_with_ai(
                user_message=message_text,
                brand_info=brand_info,
                xai_api_key=settings.xai_api_key,
                xai_model=settings.xai_model
            )
            
            # Clean up the response - remove any extra text, ensure it's just the tweet
            import re
            # Remove quotes if present
            if ai_response.startswith('"') and ai_response.endswith('"'):
                ai_response = ai_response[1:-1]
            
            # Remove common prefixes
            prefixes = [
                "Here's a post:",
                "Here's a social media post:",
                "Here's your post:",
                "Post:",
                "Tweet:",
            ]
            for prefix in prefixes:
                if ai_response.startswith(prefix):
                    ai_response = ai_response[len(prefix):].strip()
            
            # Take first line only (in case AI added extra text)
            ai_response = ai_response.split('\n')[0].strip()
            
            # Remove any trailing explanations
            if "Feel free" in ai_response or "Should I post" in ai_response:
                # Take everything before these phrases
                for phrase in ["Feel free", "Should I post", "Let me know"]:
                    if phrase in ai_response:
                        ai_response = ai_response.split(phrase)[0].strip()
            
            # Ensure under 280 characters
            if len(ai_response) > 280:
                print(f"⚠️  Post is {len(ai_response)} chars, truncating to 280")
                ai_response = ai_response[:277] + "..."
            
            print(f"✅ Cleaned post ({len(ai_response)} chars): {ai_response}")
            
            # Store the generated post
            store = get_store()
            await store.save_last_post(from_user, ai_response, brand_info.get("id"))
            
            # Send AI response back via iMessage
            imsg_client = get_imessage_client()
            
            if should_post:
                # Generate and post in one go
                brand_id = brand_info.get("id")
                print(f"📤 Posting to X with brand_id: {brand_id} (using as userId for Composio)")
                try:
                    result = await post_to_x(brand_id, ai_response)
                    print(f"📤 Post result: {result}")
                    if result.get("success"):
                        tweet_url = result.get("url", "Posted!")
                        response_msg = f"✅ Posted to X!\n\n{ai_response}\n\n🔗 {tweet_url}"
                        print(f"📱 Sending iMessage response to {from_user}: {response_msg[:100]}...")
                        await imsg_client.send_message(from_user, response_msg)
                        print(f"✅ iMessage sent successfully")
                    else:
                        error_msg = result.get('error', 'Unknown error')
                        print(f"❌ Post failed: {error_msg}")
                        await imsg_client.send_message(
                            from_user,
                            f"❌ Failed to post:\n\n{ai_response}\n\nError: {error_msg}"
                        )
                except Exception as e:
                    print(f"❌ Exception posting: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    await imsg_client.send_message(
                        from_user,
                        f"❌ Error posting:\n\n{ai_response}\n\nError: {str(e)}"
                    )
            else:
                # Just generate, ask if they want to post
                await imsg_client.send_message(
                    from_user,
                    f"🤖 {ai_response}\n\n💬 Reply 'post' or 'tweet' to post this!"
                )
            
            return {"status": "ai_chat", "response": ai_response, "posted": should_post}
            
        except Exception as e:
            print(f"Error in AI chat: {e}")
            imsg_client = get_imessage_client()
            await imsg_client.send_message(
                from_user,
                f"❌ Error: {str(e)}"
            )
            return {"status": "error", "reason": str(e)}
    
    # Not a recognized command or AI chat
    return {
        "status": "ignored",
        "reason": "Not an approval command or AI chat request",
        "hint": "Try: 'approve cr_xxx', 'generate post about X', or 'help me with...'"
    }


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
