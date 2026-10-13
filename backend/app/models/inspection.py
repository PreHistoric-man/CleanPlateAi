from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class KitchenZoneEnum(str, Enum):
    PREP_SURFACE = "prep_surface"
    STORAGE = "storage"
    DISHWASHING = "dishwashing"
    WASTE_DISPOSAL = "waste_disposal"
    EQUIPMENT = "equipment"


class SeverityEnum(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FindingSchema(BaseModel):
    id: str = Field(description="Unique identifier for finding")
    category: str = Field(description="Category of hygiene violation")
    title: str = Field(description="Short title of the finding")
    description: str = Field(description="Plain-language description of visible concern")
    severity: SeverityEnum = Field(description="Severity rating")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence of vision model")
    deduction_points: float = Field(ge=0.0, description="Points deducted from score")
    evidence_description: Optional[str] = Field(None, description="Visual evidence description or bounding region")
    corrective_recommendation: str = Field(description="Actionable cleaning or procedural fix")
    is_critical: bool = Field(default=False, description="Whether this finding triggers a critical safety warning")


class ScoringDeduction(BaseModel):
    finding_id: str
    category: str
    title: str
    severity: SeverityEnum
    points_deducted: float
    rule_applied: str


class ScoringResult(BaseModel):
    overall_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    grade: Optional[str] = None
    has_critical_warning: bool = False
    critical_warnings: List[str] = []
    deductions: List[ScoringDeduction] = []
    is_inconclusive: bool = False
    inconclusive_reason: Optional[str] = None
    status: str = "completed"
    rule_version: str = "scoring-v1.0"


class ImageValidationResult(BaseModel):
    is_valid: bool
    feedback: List[str] = []
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    file_size_bytes: int = 0
    blur_score: Optional[float] = None
    brightness_score: Optional[float] = None


class InspectionAnalyzeRequest(BaseModel):
    zone: KitchenZoneEnum
    restaurant_id: Optional[str] = None
    image_base64: Optional[str] = None
    image_url: Optional[str] = None


class InspectionReport(BaseModel):
    id: str
    restaurant_id: Optional[str] = None
    zone: KitchenZoneEnum
    photo_url: str
    overall_score: Optional[float] = None
    grade: Optional[str] = None
    status: str
    model_version: str
    is_demo: bool
    has_critical_warning: bool = False
    critical_warnings: List[str] = []
    findings: List[FindingSchema] = []
    deductions: List[ScoringDeduction] = []
    recommendations: List[str] = []
    disclaimer: str
    limitations: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
