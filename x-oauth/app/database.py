"""
Database operations for storing OAuth credentials in Supabase.
"""

import asyncpg
from typing import Optional, Dict
from datetime import datetime

from app.config import settings


class TokenStore:
    """Store and retrieve OAuth tokens from Supabase."""
    
    def __init__(self):
        self.database_url = self._build_database_url()
        self.pool: Optional[asyncpg.Pool] = None
    
    def _build_database_url(self) -> str:
        """Build PostgreSQL connection URL from Supabase URL."""
        # Supabase URL format: https://xxx.supabase.co
        # PostgreSQL URL: postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
        
        supabase_url = settings.supabase_url
        project_ref = supabase_url.split('//')[1].split('.')[0]
        
        # Extract password from service key (it's a JWT, but we need the actual password)
        # For now, this should be set manually in .env as SUPABASE_DB_PASSWORD
        return f"postgresql://postgres.{project_ref}:postgres@db.{project_ref}.supabase.co:5432/postgres"
    
    async def connect(self):
        """Establish database connection pool."""
        if not self.pool:
            # Use Supabase connection pooler
            self.pool = await asyncpg.create_pool(
                host=f"db.{settings.supabase_url.split('//')[1].split('.')[0]}.supabase.co",
                port=5432,
                user="postgres",
                password="your_supabase_password",  # Set via env
                database="postgres",
                min_size=1,
                max_size=10
            )
    
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    async def save_token(
        self,
        brand_id: str,
        access_token: str,
        refresh_token: str,
        expires_at: int,
        scope: str,
        token_type: str = "Bearer"
    ) -> bool:
        """
        Save or update OAuth credentials for a brand.
        
        Args:
            brand_id: Brand identifier
            access_token: OAuth access token
            refresh_token: OAuth refresh token
            expires_at: Unix timestamp when token expires
            scope: Granted scopes
            token_type: Token type (usually "Bearer")
            
        Returns:
            True if successful
        """
        if not self.pool:
            await self.connect()
        
        query = """
            INSERT INTO oauth_credential (
                brand_id,
                provider,
                access_token,
                refresh_token,
                expires_at,
                scope,
                token_type,
                created_at,
                updated_at
            ) VALUES ($1, 'x', $2, $3, to_timestamp($4), $5, $6, NOW(), NOW())
            ON CONFLICT (brand_id, provider)
            DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_at = EXCLUDED.expires_at,
                scope = EXCLUDED.scope,
                token_type = EXCLUDED.token_type,
                updated_at = NOW()
        """
        
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    query,
                    brand_id,
                    access_token,
                    refresh_token,
                    expires_at,
                    scope,
                    token_type
                )
            return True
        except Exception as e:
            print(f"Error saving token: {e}")
            return False
    
    async def get_token(self, brand_id: str) -> Optional[Dict[str, any]]:
        """
        Retrieve OAuth credentials for a brand.
        
        Args:
            brand_id: Brand identifier
            
        Returns:
            Token dict or None if not found
        """
        if not self.pool:
            await self.connect()
        
        query = """
            SELECT
                access_token,
                refresh_token,
                EXTRACT(EPOCH FROM expires_at)::bigint as expires_at,
                scope,
                token_type
            FROM oauth_credential
            WHERE brand_id = $1 AND provider = 'x'
        """
        
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, brand_id)
                if row:
                    return dict(row)
                return None
        except Exception as e:
            print(f"Error getting token: {e}")
            return None
    
    async def delete_token(self, brand_id: str) -> bool:
        """
        Delete OAuth credentials for a brand.
        
        Args:
            brand_id: Brand identifier
            
        Returns:
            True if successful
        """
        if not self.pool:
            await self.connect()
        
        query = "DELETE FROM oauth_credential WHERE brand_id = $1 AND provider = 'x'"
        
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(query, brand_id)
            return True
        except Exception as e:
            print(f"Error deleting token: {e}")
            return False


# Global token store instance
token_store = TokenStore()

