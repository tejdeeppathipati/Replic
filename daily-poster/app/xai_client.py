"""
xAI API client for generating daily posts.
"""

import httpx
import asyncio
from typing import Optional

from app.config import settings


class XAIClient:
    """Client for xAI (Grok) API."""
    
    def __init__(self):
        self.api_key = settings.xai_api_key
        self.api_base = settings.xai_api_base
        self.model = settings.xai_model
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature
    
    async def generate_post(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3
    ) -> str:
        """
        Generate a post using xAI (Grok) with retry logic.

        Args:
            system_prompt: System instructions with brand context
            user_prompt: What kind of post to generate
            max_retries: Maximum number of retry attempts (default: 3)

        Returns:
            Generated post text
        """
        url = f"{self.api_base}/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False
        }

        last_error = None

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    response.raise_for_status()

                    data = response.json()
                    message = data["choices"][0]["message"]["content"]
                    return message.strip()

            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                last_error = f"xAI API error: {error_detail}"

                # Check if it's a retryable error (503, 429, or temporary unavailability)
                if e.response and e.response.status_code in [503, 429, 500, 502]:
                    if attempt < max_retries - 1:
                        # Exponential backoff: 2^attempt seconds (2s, 4s, 8s)
                        wait_time = 2 ** (attempt + 1)
                        print(f"   ⚠️  xAI API temporarily unavailable, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(wait_time)
                        continue

                # Non-retryable error or final attempt
                raise Exception(last_error)

            except Exception as e:
                last_error = f"Failed to generate post: {str(e)}"

                # For other exceptions, only retry on network errors
                if attempt < max_retries - 1 and ("connection" in str(e).lower() or "timeout" in str(e).lower()):
                    wait_time = 2 ** (attempt + 1)
                    print(f"   ⚠️  Network error, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue

                raise Exception(last_error)

        # If we exhausted all retries
        raise Exception(f"Failed after {max_retries} attempts. Last error: {last_error}")


# Global instance
xai_client = XAIClient()

