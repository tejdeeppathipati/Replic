"""
xAI API client for generating replies with Grok.

xAI API is compatible with OpenAI's format.
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
    
    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generate a completion using xAI (Grok).
        
        Args:
            system_prompt: System instructions
            user_prompt: User message
            temperature: Sampling temperature (override default)
            
        Returns:
            Generated text
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
            "temperature": temperature or self.temperature,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                # Extract generated text
                message = data["choices"][0]["message"]["content"]
                return message.strip()
                
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            raise Exception(f"xAI API error: {error_detail}")
        except Exception as e:
            raise Exception(f"Failed to generate completion: {str(e)}")
    
    async def generate_with_retry(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 2
    ) -> str:
        """
        Generate with automatic retry on failure.
        
        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_retries: Maximum retry attempts
            
        Returns:
            Generated text
        """
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                return await self.generate_completion(system_prompt, user_prompt)
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    print(f"⚠️  Attempt {attempt + 1} failed, retrying...")
                    continue
                else:
                    raise last_error


# Global instance
xai_client = XAIClient()

