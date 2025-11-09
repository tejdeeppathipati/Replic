"""
Database operations for fetching brand configurations from Supabase.

This is the KEY part - getting brand keywords, watched accounts, and filters.
"""

import asyncpg
from typing import List, Dict, Optional

from app.config import settings


class BrandDatabase:
    """Fetch brand configurations from Supabase."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Connect to Supabase PostgreSQL."""
        if not self.pool:
            # Parse Supabase URL to get connection details
            # Format: https://xxx.supabase.co
            project_ref = settings.supabase_url.split('//')[1].split('.')[0]
            
            self.pool = await asyncpg.create_pool(
                host=f"db.{project_ref}.supabase.co",
                port=5432,
                user="postgres",
                password="your_supabase_password",  # Set via env: SUPABASE_DB_PASSWORD
                database="postgres",
                min_size=1,
                max_size=10
            )
    
    async def close(self):
        """Close database connection."""
        if self.pool:
            await self.pool.close()
            self.pool = None
    
    async def get_active_brands(self) -> List[Dict]:
        """
        Get all active brands that need monitoring.
        
        Returns:
            List of brand dicts with configuration
        """
        if not self.pool:
            await self.connect()
        
        query = """
            SELECT
                id,
                display_name,
                keywords,
                watched_accounts,
                persona,
                brand_brief,
                brand_voice,
                mode,
                daily_reply_cap,
                owner_whatsapp,
                owner_imessage
            FROM brand_agent
            WHERE is_active = true
        """
        
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query)
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error fetching active brands: {e}")
            return []
    
    async def get_brand_config(self, brand_id: str) -> Optional[Dict]:
        """
        Get configuration for a specific brand.
        
        Args:
            brand_id: Brand identifier
            
        Returns:
            Brand config dict or None
        """
        if not self.pool:
            await self.connect()
        
        query = """
            SELECT
                id,
                display_name,
                keywords,
                watched_accounts,
                watched_subreddits,
                persona,
                brand_brief,
                brand_voice,
                faqs,
                important_links,
                mode,
                approval_timeout_sec,
                daily_reply_cap,
                per_user_cap,
                min_reply_spacing_sec,
                owner_whatsapp,
                owner_imessage
            FROM brand_agent
            WHERE id = $1 AND is_active = true
        """
        
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(query, brand_id)
                return dict(row) if row else None
        except Exception as e:
            print(f"Error fetching brand {brand_id}: {e}")
            return None
    
    async def log_candidate(
        self,
        brand_id: str,
        platform: str,
        source_ref: str,
        proposed_text: str,
        context_url: str,
        risk_flags: List[str],
        relevance_score: float
    ) -> str:
        """
        Log a candidate tweet event.
        
        Args:
            brand_id: Brand identifier
            platform: 'x' or 'reddit'
            source_ref: Tweet/post ID
            proposed_text: Generated reply
            context_url: Link to original post
            risk_flags: Detected risk flags
            relevance_score: Calculated score
            
        Returns:
            Event ID
        """
        if not self.pool:
            await self.connect()
        
        query = """
            INSERT INTO candidate_event (
                brand_id,
                platform,
                source_ref,
                proposed_text,
                context_url,
                risk_flags,
                relevance_score,
                state,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW())
            RETURNING id
        """
        
        try:
            async with self.pool.acquire() as conn:
                event_id = await conn.fetchval(
                    query,
                    brand_id,
                    platform,
                    source_ref,
                    proposed_text,
                    context_url,
                    risk_flags,
                    relevance_score
                )
                return event_id
        except Exception as e:
            print(f"Error logging candidate: {e}")
            return None


# Global instance
brand_db = BrandDatabase()

