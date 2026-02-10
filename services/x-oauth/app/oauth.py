"""
X OAuth 2.0 PKCE (Proof Key for Code Exchange) implementation.

This module handles the OAuth flow for obtaining user-context tokens
that allow posting tweets on behalf of a brand account.
"""

import base64
import hashlib
import secrets
import time
from typing import Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from app.config import settings


class PKCEHelper:
    """Helper for PKCE (Proof Key for Code Exchange) flow."""
    
    @staticmethod
    def generate_code_verifier() -> str:
        """Generate a cryptographically random code verifier."""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    
    @staticmethod
    def generate_code_challenge(verifier: str) -> str:
        """Generate code challenge from verifier using SHA256."""
        digest = hashlib.sha256(verifier.encode('utf-8')).digest()
        return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    
    @staticmethod
    def generate_state() -> str:
        """Generate a random state parameter for CSRF protection."""
        return secrets.token_urlsafe(32)


class XOAuthClient:
    """Client for X OAuth 2.0 flows."""
    
    def __init__(self):
        self.client_id = settings.x_client_id
        self.client_secret = settings.x_client_secret
        self.redirect_uri = settings.x_redirect_uri
        self.oauth_url = settings.x_oauth_url
        self.token_url = settings.x_token_url
        self.revoke_url = settings.x_revoke_url
        self.scopes = settings.x_scopes.split()
    
    def get_authorization_url(self, state: str, code_challenge: str) -> str:
        """
        Generate the authorization URL for X OAuth.
        
        Args:
            state: CSRF protection token
            code_challenge: PKCE code challenge
            
        Returns:
            Authorization URL to redirect user to
        """
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.scopes),
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }
        
        return f"{self.oauth_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(
        self,
        code: str,
        code_verifier: str
    ) -> Dict[str, any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from callback
            code_verifier: PKCE code verifier
            
        Returns:
            Token response dict with access_token, refresh_token, expires_in
        """
        data = {
            'grant_type': 'authorization_code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'code': code,
            'code_verifier': code_verifier
        }
        
        # Add client_secret if provided (optional for PKCE)
        if self.client_secret:
            data['client_secret'] = self.client_secret
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.token_url,
                    data=data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to exchange code for token: {str(e)}"
            )
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, any]:
        """
        Refresh an expired access token.
        
        Args:
            refresh_token: The refresh token
            
        Returns:
            New token response dict
        """
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id
        }
        
        if self.client_secret:
            data['client_secret'] = self.client_secret
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.token_url,
                    data=data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to refresh token: {str(e)}"
            )
    
    async def revoke_token(self, token: str, token_type: str = "access_token") -> bool:
        """
        Revoke an access or refresh token.
        
        Args:
            token: The token to revoke
            token_type: Either 'access_token' or 'refresh_token'
            
        Returns:
            True if successful
        """
        data = {
            'token': token,
            'token_type_hint': token_type,
            'client_id': self.client_id
        }
        
        if self.client_secret:
            data['client_secret'] = self.client_secret
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.revoke_url,
                    data=data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                response.raise_for_status()
                return True
        except httpx.HTTPError:
            return False
    
    def calculate_token_expiry(self, expires_in: int) -> int:
        """
        Calculate absolute expiry timestamp.
        
        Args:
            expires_in: Seconds until expiry (from token response)
            
        Returns:
            Unix timestamp when token expires
        """
        return int(time.time()) + expires_in
    
    def is_token_expired(self, expires_at: int, buffer_seconds: int = 300) -> bool:
        """
        Check if token is expired (or will expire soon).
        
        Args:
            expires_at: Unix timestamp when token expires
            buffer_seconds: Refresh this many seconds before expiry
            
        Returns:
            True if token needs refresh
        """
        return time.time() >= (expires_at - buffer_seconds)

