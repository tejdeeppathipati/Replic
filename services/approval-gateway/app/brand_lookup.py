"""
Brand lookup from iMessage ID.
"""
from typing import Optional

from supabase import Client, create_client

from app.config import settings


def get_supabase() -> Optional[Client]:
    """Get Supabase client."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def get_brand_for_imessage(imessage_id: str) -> Optional[dict]:
    """
    Get brand info for an iMessage ID.

    Looks up brands where owner_imessage matches the iMessage ID.
    Returns the first active brand found.

    Args:
        imessage_id: iMessage email or phone number

    Returns:
        Brand dict or None
    """
    try:
        supabase = get_supabase()
        if not supabase:
            return None

        # Look up brand by owner_imessage
        # Get ALL brands with this owner_imessage, then prioritize by brand_name
        all_brands = supabase.table("brand_agent").select("*").eq("is_active", True).execute()

        matching_brands = []
        for brand in all_brands.data:
            brand_imessage = brand.get("owner_imessage", "")
            if brand_imessage and brand_imessage.lower() == imessage_id.lower():
                matching_brands.append(brand)

        if not matching_brands:
            return None

        # If multiple brands, prioritize "Airstitch" (the one that works in Activity Feed)
        # Or return the first one with a clean brand_name
        airstitch = next(
            (b for b in matching_brands if "airstitch" in (b.get("brand_name", "") or "").lower()),
            None,
        )
        if airstitch:
            print(f"✅ Found Airstitch brand: {airstitch.get('id')}")
            return airstitch

        # Otherwise return first match
        print(
            f"✅ Found brand: {matching_brands[0].get('brand_name')} (ID: {matching_brands[0].get('id')})"
        )
        return matching_brands[0]

    except Exception as e:
        print(f"Error looking up brand for iMessage {imessage_id}: {e}")
        return None
