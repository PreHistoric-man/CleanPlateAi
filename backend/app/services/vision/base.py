from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel
from app.models.inspection import FindingSchema


class VisionInferenceResult(BaseModel):
    findings: List[FindingSchema] = []
    model_version: str
    is_demo: bool = False
    is_inconclusive: bool = False
    inconclusive_reason: Optional[str] = None
    limitations: Optional[str] = None


class VisionProvider(ABC):
    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, zone: str) -> VisionInferenceResult:
        """
        Analyze a kitchen photograph for visible hygiene issues in the specified zone.
        """
        pass
