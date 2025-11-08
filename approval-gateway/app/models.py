"""
Data models for the approval gateway.
"""

from typing import Literal
from pydantic import BaseModel, Field, AnyUrl, constr
from datetime import datetime


class Candidate(BaseModel):
    """
    A candidate reply from the core bot that needs approval.
    """
    id: str = Field(..., description="Unique candidate ID, e.g., cr_8f9a...")
    brand_id: str = Field(..., description="Brand identifier")
    platform: Literal["x", "reddit"] = Field(..., description="Social platform")
    source_ref: str = Field(..., description="Tweet ID or Reddit post ID")
    proposed_text: constr(max_length=200) = Field(..., description="Generated reply text")
    persona: Literal["normal", "unhinged", "smart", "technical"] = Field(..., description="Reply persona/tone")
    context_url: AnyUrl = Field(..., description="Link to original post")
    risk_flags: list[str] = Field(default_factory=list, description="Detected risk flags")
    deadline_sec: int = Field(default=900, description="Seconds until auto-expire")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "cr_8f9a1b2c",
                "brand_id": "b_acme",
                "platform": "x",
                "source_ref": "1234567890",
                "proposed_text": "Great question! We support SSO via SAML and OAuth. Check our docs: acme.co/sso",
                "persona": "smart",
                "context_url": "https://twitter.com/user/status/1234567890",
                "risk_flags": [],
                "deadline_sec": 900
            }
        }


class Decision(BaseModel):
    """
    Final decision about a candidate reply, sent back to core.
    """
    id: str = Field(..., description="Candidate ID")
    decision: Literal["approved", "edited", "rejected", "expired"] = Field(..., description="Final decision")
    final_text: str | None = Field(None, description="Text to post (if approved/edited)")
    decider: str = Field(..., description="Who made the decision (whatsapp:+1... or imessage:...)")
    latency_ms: int = Field(..., description="Time from prompt to decision in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "cr_8f9a1b2c",
                "decision": "approved",
                "final_text": "Great question! We support SSO via SAML and OAuth. Check our docs: acme.co/sso",
                "decider": "whatsapp:+15551234567",
                "latency_ms": 45230
            }
        }


class CandidateState(BaseModel):
    """
    Internal state for tracking a candidate in Redis.
    """
    candidate: Candidate
    state: Literal["new", "prompted", "approved", "edited", "rejected", "expired"] = "new"
    created_at: datetime
    prompted_at: datetime | None = None
    decided_at: datetime | None = None
    awaiting_edit: bool = False
    decider: str | None = None


class ActivityEntry(BaseModel):
    """
    Activity log entry for the GET /activity endpoint.
    """
    id: str
    brand_id: str
    platform: str
    proposed_text: str
    state: str
    created_at: datetime
    decided_at: datetime | None = None
    decision: str | None = None
    final_text: str | None = None
    decider: str | None = None
    latency_ms: int | None = None

