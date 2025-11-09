"""
xAI API client for generating daily posts.
"""

import httpx
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
        user_prompt: str
    ) -> str:
        """
        Generate a post using xAI (Grok).
        
        Args:
            system_prompt: System instructions with brand context
            user_prompt: What kind of post to generate
            
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
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                message = data["choices"][0]["message"]["content"]
                return message.strip()
                
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            raise Exception(f"xAI API error: {error_detail}")
        except Exception as e:
            raise Exception(f"Failed to generate post: {str(e)}")


# Global instance
xai_client = XAIClient()

