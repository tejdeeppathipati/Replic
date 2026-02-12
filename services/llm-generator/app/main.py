"""
LLM Generator Service - Generate tweet replies using xAI (Grok).

Takes tweet candidates and generates appropriate replies based on:
- Brand persona (normal/smart/technical/unhinged)
- Brand context (brief, voice, FAQs)
- Tweet content and author
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.config import settings
from app.xai_client import xai_client
from app.prompts import build_system_prompt, build_user_prompt, validate_reply
from app.database import get_brand_context


app = FastAPI(
    title="LLM Generator Service",
    description="Generate tweet replies using xAI (Grok)",
    version="0.1.0"
)


class GenerateRequest(BaseModel):
    """Request to generate a reply."""
    tweet_text: str = Field(..., description="Tweet we're replying to")
    tweet_id: str = Field(..., description="Tweet ID")
    author_username: Optional[str] = Field(None, description="Tweet author")
    brand_id: str = Field(..., description="Brand ID (fetches full context from database)")
    persona: str = Field("normal", description="Reply persona (normal/smart/technical/unhinged)")
    context_url: str = Field(..., description="Link to original tweet")


class GenerateResponse(BaseModel):
    """Response with generated reply."""
    tweet_id: str
    proposed_text: str
    persona: str
    context_url: str
    is_valid: bool
    validation_error: Optional[str] = None
    character_count: int


@app.get("/")
async def root():
    """Health check."""
    return {
        "service": "llm-generator",
        "status": "ok",
        "version": "0.1.0",
        "model": settings.xai_model
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate_reply(request: GenerateRequest):
    """
    Generate a reply to a tweet using xAI (Grok).
    
    Steps:
    1. Fetch FULL brand context from database
    2. Build comprehensive system prompt with all brand info
    3. Build user prompt with tweet text
    4. Call xAI API
    5. Validate reply (length, quality)
    6. Return result
    """
    # 1. Fetch brand context from database
    brand_context = await get_brand_context(request.brand_id)
    
    if not brand_context:
        raise HTTPException(
            status_code=404,
            detail=f"Brand not found or inactive: {request.brand_id}"
        )
    
    # 2. Build system prompt with FULL brand context
    system_prompt = build_system_prompt(
        persona=request.persona,
        brand_context=brand_context
    )
    
    # 3. Build user prompt
    author_context = f"@{request.author_username}" if request.author_username else None
    user_prompt = build_user_prompt(
        tweet_text=request.tweet_text,
        author_context=author_context
    )
    
    # 4. Generate reply with xAI
    try:
        generated_text = await xai_client.generate_with_retry(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate reply: {str(e)}"
        )
    
    # 5. Validate reply
    is_valid, validation_error = validate_reply(
        reply=generated_text,
        max_length=settings.max_reply_length
    )
    
    # 6. Return result
    return GenerateResponse(
        tweet_id=request.tweet_id,
        proposed_text=generated_text,
        persona=request.persona,
        context_url=request.context_url,
        is_valid=is_valid,
        validation_error=validation_error,
        character_count=len(generated_text)
    )


@app.post("/generate/batch")
async def generate_batch(requests: List[GenerateRequest]):
    """
    Generate replies for multiple tweets at once.
    
    Useful for processing a batch of candidates.
    """
    results = []
    
    for req in requests:
        try:
            result = await generate_reply(req)
            results.append(result)
        except Exception as e:
            # Continue with other requests even if one fails
            results.append({
                "tweet_id": req.tweet_id,
                "error": str(e),
                "is_valid": False
            })
    
    return {
        "total": len(requests),
        "successful": sum(1 for r in results if r.get("is_valid", False)),
        "failed": sum(1 for r in results if not r.get("is_valid", True)),
        "results": results
    }


@app.post("/test")
async def test_generation(
    tweet_text: str = "Looking for a good CRM solution for my startup",
    brand_id: str = "test-brand",
    persona: str = "normal"
):
    """
    Test endpoint for quick reply generation testing.
    
    Note: Make sure the brand_id exists in your Supabase database!
    """
    request = GenerateRequest(
        tweet_text=tweet_text,
        tweet_id="test123",
        brand_id=brand_id,
        persona=persona,
        context_url="https://x.com/user/status/test123"
    )
    
    return await generate_reply(request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)

