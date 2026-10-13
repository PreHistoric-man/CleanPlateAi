from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("", tags=["Health"])
@router.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.APP_ENV,
        "ai_adapter": settings.AI_VISION_ADAPTER,
        "version": "1.0.0"
    }
