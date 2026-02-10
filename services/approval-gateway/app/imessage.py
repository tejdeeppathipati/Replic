"""
Photon iMessage Kit client for approval prompts.
"""

import re
from typing import Optional

import httpx

from app.models import Candidate


class iMessageClient:
    """
    Client for Photon iMessage Kit sidecar.

    Assumes the Photon iMessage Kit sidecar exposes a REST API
    at the configured base URL.
    """

    def __init__(self, base_url: str):
        """
        Initialize iMessage client.

        Args:
            base_url: Base URL of Photon iMessage Kit sidecar
        """
        self.base_url = base_url.rstrip("/")
        self.http_client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()

    async def send_approval_prompt(self, candidate: Candidate, recipient: str) -> None:
        """
        Send an approval prompt via iMessage.

        Args:
            candidate: Candidate to prompt for
            recipient: Apple ID or phone number to send message to
        """
        message_text = (
            f"🤖 Replic Reply\n\n"
            f"ID: {candidate.id}\n"
            f"Platform: {candidate.platform.upper()}\n"
            f"Persona: {candidate.persona}\n\n"
            f"Proposed:\n{candidate.proposed_text}\n\n"
            f"Link: {candidate.context_url}\n\n"
            f"Commands:\n"
            f"• approve {candidate.id}\n"
            f"• edit {candidate.id}: <text>\n"
            f"• skip {candidate.id}"
        )

        if candidate.risk_flags:
            message_text += f"\n\nRisks: {', '.join(candidate.risk_flags)}"

        await self.send_message(recipient, message_text)

    async def send_message(self, recipient: str, text: str) -> None:
        """
        Send a plain message via iMessage.

        Args:
            recipient: Apple ID or phone number to send message to
            text: Message text
        """
        try:
            response = await self.http_client.post(
                f"{self.base_url}/send", json={"recipient": recipient, "text": text}
            )
            response.raise_for_status()
        except httpx.HTTPError as e:
            raise RuntimeError(f"Failed to send iMessage: {str(e)}") from e


def parse_imessage_command(text: str) -> Optional[dict]:
    """
    Parse iMessage command text into structured data.

    Supported formats:
    - approve cr_123
    - edit cr_123: new reply text here
    - skip cr_123

    Args:
        text: Message text from iMessage

    Returns:
        Dict with action, candidate_id, and optional edited_text, or None if invalid
    """
    text = text.strip()

    # Pattern: approve <candidate_id>
    approve_pattern = r"^approve\s+(cr_[A-Za-z0-9_]+)$"
    match = re.match(approve_pattern, text, re.IGNORECASE)
    if match:
        return {"action": "approved", "candidate_id": match.group(1), "edited_text": None}

    # Pattern: skip <candidate_id>
    skip_pattern = r"^skip\s+(cr_[A-Za-z0-9_]+)$"
    match = re.match(skip_pattern, text, re.IGNORECASE)
    if match:
        return {"action": "rejected", "candidate_id": match.group(1), "edited_text": None}

    # Pattern: edit <candidate_id>: <text>
    edit_pattern = r"^edit\s+(cr_[A-Za-z0-9_]+):\s*(.+)$"
    match = re.match(edit_pattern, text, re.IGNORECASE | re.DOTALL)
    if match:
        candidate_id = match.group(1)
        edited_text = match.group(2).strip()

        # Enforce 200 char limit
        if len(edited_text) > 200:
            edited_text = edited_text[:200]

        return {"action": "edited", "candidate_id": candidate_id, "edited_text": edited_text}

    return None


# Global instance
imessage_client: Optional[iMessageClient] = None


def get_imessage_client() -> iMessageClient:
    """Get the global iMessage client instance."""
    if imessage_client is None:
        raise RuntimeError("iMessage client not initialized")
    return imessage_client


def init_imessage_client(base_url: str) -> iMessageClient:
    """Initialize the global iMessage client."""
    global imessage_client
    imessage_client = iMessageClient(base_url)
    return imessage_client
