"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError
from app.models import Candidate, Decision


def test_candidate_validation():
    """Test candidate model validation."""
    candidate = Candidate(
        id="cr_test123",
        brand_id="b_acme",
        platform="x",
        source_ref="1234567890",
        proposed_text="Test reply",
        persona="normal",
        context_url="https://twitter.com/user/status/123",
        risk_flags=[],
        deadline_sec=900
    )
    
    assert candidate.id == "cr_test123"
    assert candidate.platform == "x"
    assert candidate.persona == "normal"


def test_candidate_invalid_platform():
    """Test that invalid platform raises error."""
    with pytest.raises(ValidationError):
        Candidate(
            id="cr_test",
            brand_id="b_test",
            platform="invalid",  # Should be 'x' or 'reddit'
            source_ref="123",
            proposed_text="Test",
            persona="normal",
            context_url="https://example.com",
        )


def test_candidate_invalid_persona():
    """Test that invalid persona raises error."""
    with pytest.raises(ValidationError):
        Candidate(
            id="cr_test",
            brand_id="b_test",
            platform="x",
            source_ref="123",
            proposed_text="Test",
            persona="invalid_persona",  # Invalid
            context_url="https://example.com",
        )


def test_candidate_text_max_length():
    """Test that proposed text can be up to 200 chars."""
    long_text = "x" * 200
    candidate = Candidate(
        id="cr_test",
        brand_id="b_test",
        platform="x",
        source_ref="123",
        proposed_text=long_text,
        persona="normal",
        context_url="https://example.com",
    )
    
    assert len(candidate.proposed_text) == 200


def test_decision_validation():
    """Test decision model validation."""
    decision = Decision(
        id="cr_test",
        decision="approved",
        final_text="Final text here",
        decider="whatsapp:+15551234567",
        latency_ms=1234
    )
    
    assert decision.decision == "approved"
    assert decision.final_text == "Final text here"


def test_decision_invalid_type():
    """Test that invalid decision type raises error."""
    with pytest.raises(ValidationError):
        Decision(
            id="cr_test",
            decision="invalid_decision",  # Invalid
            final_text="Text",
            decider="whatsapp:+15551234567",
            latency_ms=1000
        )

