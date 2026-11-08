import time
from typing import Any, Dict, List, cast
from app.core.database import get_supabase
from app.repositories.seed_store import LISTINGS, map_supabase_listing


class ListingRepository:
    @staticmethod
    def list_all(limit: int = 50) -> List[Dict[str, Any]]:
        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("listings")
                    .select("*")
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data and isinstance(res.data, list):
                    return [
                        map_supabase_listing(cast(Dict[str, Any], row))
                        for row in res.data
                        if isinstance(row, dict)
                    ]
            except Exception:
                pass
        return LISTINGS

    @staticmethod
    def create(
        title: str,
        description: str,
        kind: str,
        category: str,
        price_label: str,
        zone_name: str,
        accepts_barter: bool,
        display_name: str,
    ) -> Dict[str, Any]:
        modes = [kind, "barter"] if accepts_barter and kind != "barter" else [kind]
        initials = "".join([part[0] for part in display_name.split()[:2]]).upper() or "NB"
        resolved_price = price_label or (
            "Sin costo" if kind in ("gift", "help") else "Por coordinar"
        )
        map_x = 30 + ((len(title) * 7) % 55)
        map_y = 22 + ((len(description) * 3) % 62)

        supabase = get_supabase()
        if supabase:
            try:
                res = (
                    supabase.table("listings")
                    .insert(
                        {
                            "title": title,
                            "description": description,
                            "kind": kind,
                            "modes": modes,
                            "category": category,
                            "price_label": resolved_price,
                            "zone_name": zone_name,
                            "location_label": f"Punto aproximado en {zone_name}",
                            "distance_km": 0.3,
                            "map_x": map_x,
                            "map_y": map_y,
                            "availability": "now",
                            "provider_name": display_name,
                            "provider_initials": initials,
                            "featured": False,
                        }
                    )
                    .execute()
                )
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_row = cast(Dict[str, Any], res.data[0])
                    return map_supabase_listing(first_row)
            except Exception:
                pass

        new_item = {
            "id": f"listing-{int(time.time() * 1000)}",
            "title": title,
            "description": description,
            "kind": kind,
            "modes": modes,
            "category": category,
            "priceLabel": resolved_price,
            "zoneName": zone_name,
            "locationLabel": f"Punto aproximado en {zone_name}",
            "distanceKm": 0.3,
            "x": map_x,
            "y": map_y,
            "availability": "now",
            "providerName": display_name,
            "initials": initials,
            "rating": 5.0,
            "reviewCount": 1,
            "completedCount": 1,
            "featured": False,
            "isDemo": False,
        }
        LISTINGS.insert(0, new_item)
        return new_item
