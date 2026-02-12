"""
X OAuth Service - FastAPI application.

Handles OAuth 2.0 PKCE flow for obtaining X API tokens.
"""

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.oauth import XOAuthClient, PKCEHelper
from app.database import token_store


# In-memory storage for OAuth states (use Redis in production)
oauth_states = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    print("🚀 Starting X OAuth Service...")
    
    # Initialize database connection
    await token_store.connect()
    print("✅ Database connected")
    
    print(f"Server ready on port {settings.port}")
    
    yield
    
    # Cleanup
    print("Shutting down...")
    await token_store.close()
    print("Goodbye!")


app = FastAPI(
    title="X OAuth Service",
    description="OAuth 2.0 PKCE flow for X API access",
    version="0.1.0",
    lifespan=lifespan
)


class ConnectionRequest(BaseModel):
    """Request to start OAuth flow."""
    brand_id: str
    redirect_after_success: Optional[str] = None


class ConnectionResponse(BaseModel):
    """Response with authorization URL."""
    authorization_url: str
    state: str


class TokenResponse(BaseModel):
    """OAuth token response."""
    brand_id: str
    access_token: str
    expires_at: int
    scope: str
    message: str


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "x-oauth",
        "status": "ok",
        "version": "0.1.0"
    }


@app.post("/x/connect", response_model=ConnectionResponse)
async def start_oauth_flow(request: ConnectionRequest):
    """
    Start OAuth flow for a brand.
    
    This generates an authorization URL that the user should visit
    to grant access to their X account.
    """
    # Generate PKCE parameters
    code_verifier = PKCEHelper.generate_code_verifier()
    code_challenge = PKCEHelper.generate_code_challenge(code_verifier)
    state = PKCEHelper.generate_state()
    
    # Store state for verification in callback
    oauth_states[state] = {
        'brand_id': request.brand_id,
        'code_verifier': code_verifier,
        'redirect_after_success': request.redirect_after_success
    }
    
    # Generate authorization URL
    oauth_client = XOAuthClient()
    auth_url = oauth_client.get_authorization_url(state, code_challenge)
    
    return ConnectionResponse(
        authorization_url=auth_url,
        state=state
    )


@app.get("/x/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="State parameter"),
    error: Optional[str] = Query(None, description="Error if any")
):
    """
    OAuth callback endpoint.
    
    X redirects here after user grants/denies access.
    """
    # Handle error response
    if error:
        return JSONResponse(
            status_code=400,
            content={
                "error": error,
                "message": "User denied access or an error occurred"
            }
        )
    
    # Verify state parameter
    if state not in oauth_states:
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter (possible CSRF attack)"
        )
    
    # Retrieve stored OAuth state
    oauth_state = oauth_states.pop(state)
    brand_id = oauth_state['brand_id']
    code_verifier = oauth_state['code_verifier']
    redirect_url = oauth_state.get('redirect_after_success')
    
    # Exchange code for tokens
    oauth_client = XOAuthClient()
    try:
        token_response = await oauth_client.exchange_code_for_token(
            code=code,
            code_verifier=code_verifier
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exchange code for token: {str(e)}"
        )
    
    # Calculate expiry timestamp
    expires_at = oauth_client.calculate_token_expiry(
        token_response.get('expires_in', 7200)
    )
    
    # Save tokens to database
    success = await token_store.save_token(
        brand_id=brand_id,
        access_token=token_response['access_token'],
        refresh_token=token_response.get('refresh_token', ''),
        expires_at=expires_at,
        scope=token_response.get('scope', settings.x_scopes)
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to save tokens to database"
        )
    
    # Redirect to success page or return JSON
    if redirect_url:
        return RedirectResponse(url=f"{redirect_url}?success=true&brand_id={brand_id}")
    
    return {
        "success": True,
        "brand_id": brand_id,
        "message": "X account connected successfully!",
        "expires_at": expires_at
    }


@app.post("/x/refresh/{brand_id}")
async def refresh_token(brand_id: str):
    """
    Refresh expired access token for a brand.
    
    This should be called automatically when a token is about to expire.
    """
    # Get current tokens
    current_tokens = await token_store.get_token(brand_id)
    if not current_tokens:
        raise HTTPException(
            status_code=404,
            detail="No tokens found for this brand"
        )
    
    # Refresh the token
    oauth_client = XOAuthClient()
    try:
        token_response = await oauth_client.refresh_access_token(
            refresh_token=current_tokens['refresh_token']
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh token: {str(e)}"
        )
    
    # Calculate new expiry
    expires_at = oauth_client.calculate_token_expiry(
        token_response.get('expires_in', 7200)
    )
    
    # Update tokens in database
    success = await token_store.save_token(
        brand_id=brand_id,
        access_token=token_response['access_token'],
        refresh_token=token_response.get('refresh_token', current_tokens['refresh_token']),
        expires_at=expires_at,
        scope=token_response.get('scope', current_tokens['scope'])
    )
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to save refreshed tokens"
        )
    
    return TokenResponse(
        brand_id=brand_id,
        access_token=token_response['access_token'],
        expires_at=expires_at,
        scope=token_response.get('scope', current_tokens['scope']),
        message="Token refreshed successfully"
    )


@app.get("/x/token/{brand_id}")
async def get_token(brand_id: str) -> TokenResponse:
    """
    Get current access token for a brand.
    
    Automatically refreshes if expired.
    """
    # Get tokens from database
    tokens = await token_store.get_token(brand_id)
    if not tokens:
        raise HTTPException(
            status_code=404,
            detail="No tokens found for this brand. Please connect X account first."
        )
    
    # Check if token needs refresh
    oauth_client = XOAuthClient()
    if oauth_client.is_token_expired(tokens['expires_at']):
        # Token expired, refresh it
        refresh_response = await refresh_token(brand_id)
        return refresh_response
    
    return TokenResponse(
        brand_id=brand_id,
        access_token=tokens['access_token'],
        expires_at=tokens['expires_at'],
        scope=tokens['scope'],
        message="Token retrieved successfully"
    )


@app.delete("/x/disconnect/{brand_id}")
async def disconnect(brand_id: str):
    """
    Disconnect X account for a brand.
    
    Revokes tokens and removes from database.
    """
    # Get tokens
    tokens = await token_store.get_token(brand_id)
    if not tokens:
        raise HTTPException(
            status_code=404,
            detail="No tokens found for this brand"
        )
    
    # Revoke tokens with X
    oauth_client = XOAuthClient()
    await oauth_client.revoke_token(tokens['access_token'], "access_token")
    if tokens.get('refresh_token'):
        await oauth_client.revoke_token(tokens['refresh_token'], "refresh_token")
    
    # Delete from database
    success = await token_store.delete_token(brand_id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete tokens from database"
        )
    
    return {
        "success": True,
        "brand_id": brand_id,
        "message": "X account disconnected successfully"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)

