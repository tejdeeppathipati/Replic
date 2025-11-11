#!/usr/bin/env python3
"""
Quick test script to send a test candidate to the approval-gateway.
This will trigger a WhatsApp message to your configured number.

⚠️  IMPORTANT: For Twilio WhatsApp Sandbox
Before testing with a new number, that person must:
1. Send a WhatsApp message to: +1 415 523 8886
2. Type: "join <your-sandbox-code>"
3. Wait for confirmation
4. Then run this script!

Find your sandbox code at: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
"""

import httpx
import sys
from datetime import datetime

# Approval gateway URL
APPROVAL_GATEWAY_URL = "http://localhost:8000"

# Change this to any WhatsApp number that has joined your Twilio Sandbox
# Format: "whatsapp:+1234567890" (include country code, no spaces or dashes)
#TEST_PHONE_NUMBER = "whatsapp:+17034532810"  # Your original number
TEST_PHONE_NUMBER = "whatsapp:+12408890686"  # Alternative test number (must join sandbox first!)

# Test candidate data
test_candidate = {
    "id": f"cr_test_{int(datetime.now().timestamp())}",
    "brand_id": "test-brand",
    "platform": "x",
    "source_ref": "1234567890",
    "proposed_text": "Thanks for sharing this! We've had similar experiences with our platform. Would love to connect! 🚀",
    "persona": "normal",
    "context_url": "https://x.com/user/status/1234567890",
    "risk_flags": [],
    "deadline_sec": 900,
    "owner_whatsapp": TEST_PHONE_NUMBER,
    "owner_imessage": None
}

def test_approval_flow():
    """Send a test candidate to the approval gateway."""
    try:
        print("=" * 70)
        print("🚀 Replic Approval Gateway - WhatsApp Test")
        print("=" * 70)
        print(f"📱 Sending WhatsApp to: {test_candidate['owner_whatsapp']}")
        print(f"🆔 Candidate ID: {test_candidate['id']}")
        print()
        print("⚠️  NOTE: If this number hasn't joined the Twilio Sandbox:")
        print("   1. Send WhatsApp to: +1 415 523 8886")
        print("   2. Type: join <your-sandbox-code>")
        print("   3. Find your code: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn")
        print()
        print("Sending request...")
        print()
        
        response = httpx.post(
            f"{APPROVAL_GATEWAY_URL}/candidate",
            json=test_candidate,
            headers={
                "Authorization": "Bearer change-me-in-production",
                "Content-Type": "application/json"
            },
            timeout=10.0
        )
        
        response.raise_for_status()
        result = response.json()
        
        print("✅ Success!")
        print(f"Status: {result.get('status')}")
        print(f"Channels: {result.get('channels', [])}")
        print()
        print("📱 Check your WhatsApp for the approval message!")
        print(f"💬 To approve, reply: approve {test_candidate['id']}")
        print(f"❌ To reject, reply: reject {test_candidate['id']}")
        print(f"✏️  To edit, reply: edit {test_candidate['id']} Your new text here")
        
    except httpx.HTTPError as e:
        print(f"❌ Error: {e}")
        print()
        print("🔍 Troubleshooting:")
        print("  1. Is the approval-gateway running? Check: curl http://localhost:8000/")
        print("  2. Is Redis running? Check: redis-cli ping")
        print("  3. Check the logs: tail -f /tmp/approval-gateway.log")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_approval_flow()

