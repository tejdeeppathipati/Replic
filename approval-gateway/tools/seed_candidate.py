#!/usr/bin/env python3
"""
Seed script to inject demo candidate replies for testing.

Usage:
    python tools/seed_candidate.py [--url http://localhost:8080]
"""

import argparse
import asyncio
import httpx
import sys
from datetime import datetime


async def create_demo_candidate(base_url: str, secret: str):
    """Create and send a demo candidate to the approval gateway."""
    
    candidate = {
        "id": f"cr_demo_{int(datetime.now().timestamp())}",
        "brand_id": "b_acme_corp",
        "platform": "x",
        "source_ref": "1234567890123456789",
        "proposed_text": "Great question! We support SSO via SAML and OAuth2. Check our docs at acme.co/sso for setup guides.",
        "persona": "smart",
        "context_url": "https://twitter.com/user/status/1234567890123456789",
        "risk_flags": [],
        "deadline_sec": 900
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {secret}"
    }
    
    print(f"Sending candidate: {candidate['id']}")
    print(f"   Brand: {candidate['brand_id']}")
    print(f"   Platform: {candidate['platform']}")
    print(f"   Text: {candidate['proposed_text'][:60]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{base_url}/candidate",
                json=candidate,
                headers=headers
            )
            
            if response.status_code == 202:
                result = response.json()
                print(f"Success! Status: {result['status']}")
                print(f"   Candidate ID: {result['candidate_id']}")
                if 'channels' in result:
                    print(f"   Channels: {', '.join(result['channels'])}")
                print(f"\nCheck your WhatsApp/iMessage for the approval prompt!")
                print(f"\nTo approve, send:")
                print(f"   approve {candidate['id']}")
                print(f"\nTo edit, send:")
                print(f"   edit {candidate['id']}: your new text here")
                print(f"\nTo skip, send:")
                print(f" skip {candidate['id']}")
                return True
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
                return False
                
    except httpx.HTTPError as e:
        print(f"Request failed: {e}")
        return False


async def create_multiple_candidates(base_url: str, secret: str, count: int):
    """Create multiple demo candidates."""
    
    personas = ["normal", "smart", "technical", "unhinged"]
    platforms = ["x", "reddit"]
    
    texts = [
        "Thanks for asking! We just shipped this last week. Check it out at acme.co/features",
        "Great point - we're working on this. Should land in Q2. Follow us for updates!",
        "We use AES-256 encryption with key rotation every 90 days. See our security whitepaper.",
        "lol this is actually kind of genius. we should collab. DM us your contact",
        "Appreciate the feedback! Can you share more details so we can look into this?",
    ]
    
    for i in range(count):
        candidate = {
            "id": f"cr_demo_{int(datetime.now().timestamp())}_{i}",
            "brand_id": "b_acme_corp",
            "platform": platforms[i % len(platforms)],
            "source_ref": f"post_{1234567890 + i}",
            "proposed_text": texts[i % len(texts)],
            "persona": personas[i % len(personas)],
            "context_url": f"https://example.com/post/{1234567890 + i}",
            "risk_flags": ["politics"] if i == 3 else [],
            "deadline_sec": 900
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}"
        }
        
        print(f"\n[{i+1}/{count}] Creating candidate {candidate['id']}...")
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{base_url}/candidate",
                    json=candidate,
                    headers=headers
                )
                
                if response.status_code == 202:
                    result = response.json()
                    print(f"{result['status']}")
                else:
                    print(f"{response.status_code}")
        except Exception as e:
            print(f"{e}")
        
        # Small delay to respect rate limits
        await asyncio.sleep(2)


def main():
    parser = argparse.ArgumentParser(description="Seed demo candidates for testing")
    parser.add_argument(
        "--url",
        default="http://localhost:8080",
        help="Base URL of approval gateway"
    )
    parser.add_argument(
        "--secret",
        default="change-me-in-production",
        help="Webhook signing secret"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1,
        help="Number of candidates to create"
    )
    
    args = parser.parse_args()
    
    print("BrandPilot Candidate Seeder")
    print(f" Gateway: {args.url}")
    print(f" Count: {args.count}\n")
    
    if args.count == 1:
        success = asyncio.run(create_demo_candidate(args.url, args.secret))
    else:
        asyncio.run(create_multiple_candidates(args.url, args.secret, args.count))
        success = True
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

