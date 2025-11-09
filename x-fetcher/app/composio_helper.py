"""
Composio helper for getting OAuth tokens.

We use Composio ONLY for OAuth token management.
Actual X API calls are made directly.
"""

from typing import Optional
from composio import Composio, Action

from app.config import settings


class ComposioTokenManager:
    """Manage OAuth tokens via Composio."""
    
    def __init__(self):
        self.composio = Composio(api_key=settings.composio_api_key)
    
    async def get_x_token(self, brand_id: str) -> Optional[str]:
        """
        Get X API access token for a brand.
        
        Composio manages the OAuth flow and token refresh.
        We just retrieve the token and use it for direct X API calls.
        
        Args:
            brand_id: Brand identifier (used as entity_id in Composio)
            
        Returns:
            Access token or None if not connected
        """
        try:
            # Get entity (brand) from Composio
            entity = self.composio.get_entity(id=brand_id)
            
            # Get Twitter connection for this entity
            connection = entity.get_connection(app="twitter")
            
            if not connection:
                print(f"No Twitter connection found for brand: {brand_id}")
                return None
            
            # Get access token (Composio handles refresh automatically)
            access_token = connection.access_token
            
            return access_token
            
        except Exception as e:
            print(f"Error getting token for brand {brand_id}: {e}")
            return None
    
    async def get_user_id(self, brand_id: str) -> Optional[str]:
        """
        Get the X user ID for a brand.
        
        Args:
            brand_id: Brand identifier
            
        Returns:
            X user ID or None
        """
        try:
            entity = self.composio.get_entity(id=brand_id)
            connection = entity.get_connection(app="twitter")
            
            if not connection:
                return None
            
            # Get user info from connection metadata
            # This might be stored differently depending on Composio's structure
            return connection.metadata.get("user_id")
            
        except Exception as e:
            print(f"Error getting user ID for brand {brand_id}: {e}")
            return None
    
    def is_connected(self, brand_id: str) -> bool:
        """
        Check if a brand has Twitter connected via Composio.
        
        Args:
            brand_id: Brand identifier
            
        Returns:
            True if connected
        """
        try:
            entity = self.composio.get_entity(id=brand_id)
            connection = entity.get_connection(app="twitter")
            return connection is not None
        except:
            return False


# Global instance
token_manager = ComposioTokenManager()

