"""
Twilio WhatsApp integration for approval prompts.
"""

import os
import hashlib
import hmac
from typing import Optional
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from app.models import Candidate


class WhatsAppClient:
    """
    Handles WhatsApp message sending via Twilio.
    """

    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        from_number: str
    ):
        """
        Initialize Twilio WhatsApp client.
        
        Args:
            account_sid: Twilio account SID
            auth_token: Twilio auth token
            from_number: WhatsApp-enabled Twilio number (format: whatsapp:+1...)
        """
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number
        self.validator = RequestValidator(auth_token)

    def send_approval_prompt(self, candidate: Candidate, to_number: str) -> str:
        """
        Send an approval prompt for a candidate reply.
        
        Args:
            candidate: Candidate to prompt for
            to_number: Recipient's WhatsApp number (format: whatsapp:+1...)
            
        Returns:
            Twilio message SID
        """
        # Truncate context for readability
        context_snippet = candidate.proposed_text[:100]
        if len(candidate.proposed_text) > 100:
            context_snippet += "..."
        
        message_body = (
            f"*Replic Reply*\n\n"
            f"ID: `{candidate.id}`\n"
            f"Platform: {candidate.platform.upper()}\n"
            f"Persona: {candidate.persona}\n\n"
            f"*Proposed Reply:*\n{candidate.proposed_text}\n\n"
            f"*Context:* {candidate.context_url}\n\n"
            f"Reply with:\n"
            f"• `approve {candidate.id}` to post\n"
            f"• `edit {candidate.id}: <new text>` to modify\n"
            f"• `skip {candidate.id}` to ignore"
        )
        
        if candidate.risk_flags:
            message_body += f"\n\n *Risks:* {', '.join(candidate.risk_flags)}"
        
        try:
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=to_number
            )
            return message.sid
        except Exception as e:
            raise RuntimeError(f"Failed to send WhatsApp message: {str(e)}")

    def validate_webhook(
        self,
        url: str,
        params: dict,
        signature: str
    ) -> bool:
        """
        Validate Twilio webhook signature.
        
        Args:
            url: Full webhook URL
            params: Request parameters
            signature: X-Twilio-Signature header value
            
        Returns:
            True if signature is valid
        """
        return self.validator.validate(url, params, signature)


def parse_whatsapp_command(text: str) -> Optional[dict]:
    """
    Parse WhatsApp command text into structured data.
    
    Supported formats:
    - approve cr_123
    - edit cr_123: new reply text here
    - skip cr_123
    
    Args:
        text: Message text from WhatsApp
        
    Returns:
        Dict with action, candidate_id, and optional edited_text, or None if invalid
    """
    text = text.strip()
    
    # Try to match approve
    if text.lower().startswith("approve "):
        parts = text.split(maxsplit=1)
        if len(parts) == 2:
            return {
                "action": "approved",
                "candidate_id": parts[1].strip(),
                "edited_text": None
            }
    
    # Try to match skip
    elif text.lower().startswith("skip "):
        parts = text.split(maxsplit=1)
        if len(parts) == 2:
            return {
                "action": "rejected",
                "candidate_id": parts[1].strip(),
                "edited_text": None
            }
    
    # Try to match edit
    elif text.lower().startswith("edit "):
        # Format: edit cr_123: new text here
        rest = text[5:].strip()  # Remove "edit "
        if ":" in rest:
            candidate_id, edited_text = rest.split(":", 1)
            edited_text = edited_text.strip()
            
            # Enforce 200 char limit
            if len(edited_text) > 200:
                edited_text = edited_text[:200]
            
            return {
                "action": "edited",
                "candidate_id": candidate_id.strip(),
                "edited_text": edited_text
            }
    
    return None


# Global instance
whatsapp_client: Optional[WhatsAppClient] = None


def get_whatsapp_client() -> WhatsAppClient:
    """Get the global WhatsApp client instance."""
    if whatsapp_client is None:
        raise RuntimeError("WhatsApp client not initialized")
    return whatsapp_client


def init_whatsapp_client(
    account_sid: str,
    auth_token: str,
    from_number: str
) -> WhatsAppClient:
    """Initialize the global WhatsApp client."""
    global whatsapp_client
    whatsapp_client = WhatsAppClient(account_sid, auth_token, from_number)
    return whatsapp_client

