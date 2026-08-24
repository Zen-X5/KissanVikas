from pydantic import BaseModel
from typing import Optional

from app.schemas.spatial_twin import SpatialTwinOutput


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[SpatialTwinOutput] = None