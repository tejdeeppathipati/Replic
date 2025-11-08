"""Tests for iMessage integration."""

import pytest
from app.imessage import parse_imessage_command


def test_parse_approve_command():
    """Test parsing approve command."""
    result = parse_imessage_command("approve cr_12345")
    assert result is not None
    assert result["action"] == "approved"
    assert result["candidate_id"] == "cr_12345"
    assert result["edited_text"] is None


def test_parse_skip_command():
    """Test parsing skip command."""
    result = parse_imessage_command("skip cr_67890")
    assert result is not None
    assert result["action"] == "rejected"
    assert result["candidate_id"] == "cr_67890"
    assert result["edited_text"] is None


def test_parse_edit_command():
    """Test parsing edit command."""
    result = parse_imessage_command("edit cr_abc123: This is the new reply")
    assert result is not None
    assert result["action"] == "edited"
    assert result["candidate_id"] == "cr_abc123"
    assert result["edited_text"] == "This is the new reply"


def test_parse_edit_multiline():
    """Test parsing edit command with multiline text."""
    text = "edit cr_test: First line\nSecond line"
    result = parse_imessage_command(text)
    assert result is not None
    assert "First line\nSecond line" in result["edited_text"]


def test_parse_edit_command_truncates():
    """Test that edit command truncates text > 200 chars."""
    long_text = "y" * 250
    result = parse_imessage_command(f"edit cr_test: {long_text}")
    assert result is not None
    assert len(result["edited_text"]) == 200


def test_parse_invalid_command():
    """Test parsing invalid command."""
    result = parse_imessage_command("invalid command")
    assert result is None
    
    result = parse_imessage_command("approve")
    assert result is None
    
    result = parse_imessage_command("edit without colon cr_123")
    assert result is None


def test_parse_with_extra_whitespace():
    """Test parsing with extra whitespace."""
    result = parse_imessage_command("  approve   cr_test  ")
    assert result is not None
    assert result["action"] == "approved"

