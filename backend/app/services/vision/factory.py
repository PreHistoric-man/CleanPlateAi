from app.core.config import settings
from app.services.vision.base import VisionProvider
from app.services.vision.mock_adapter import MockDemoVisionAdapter
from app.services.vision.gemini_adapter import GeminiVisionAdapter


def get_vision_adapter(provider_type: str = None) -> VisionProvider:
    provider = (provider_type or settings.AI_VISION_ADAPTER).lower().strip()
    if provider == "gemini":
        return GeminiVisionAdapter()
    return MockDemoVisionAdapter()
