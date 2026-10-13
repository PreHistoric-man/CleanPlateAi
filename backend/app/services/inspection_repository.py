import logging
from typing import Dict, Optional
from app.core.config import settings
from app.models.inspection import InspectionReport

logger = logging.getLogger(__name__)

# In-memory development store for local testing without cloud Supabase connection
_IN_MEMORY_STORE: Dict[str, InspectionReport] = {}


class InspectionRepository:
    def __init__(self):
        self.supabase_client = None
        self._init_supabase()

    def _init_supabase(self):
        if (
            settings.SUPABASE_URL
            and "placeholder" not in settings.SUPABASE_URL
            and settings.SUPABASE_SERVICE_ROLE_KEY
            and "placeholder" not in settings.SUPABASE_SERVICE_ROLE_KEY
        ):
            try:
                from supabase import create_client
                self.supabase_client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("Connected to Supabase PostgreSQL.")
            except Exception as e:
                logger.warning(f"Could not initialize Supabase client: {e}. Falling back to dev store.")
                self.supabase_client = None
        else:
            logger.info("Using local development in-memory repository (Supabase credentials are placeholder).")

    def save_assessment(self, report: InspectionReport) -> Dict[str, any]:
        _IN_MEMORY_STORE[report.id] = report

        if self.supabase_client:
            try:
                # Insert assessment record
                assessment_data = {
                    "id": report.id,
                    "restaurant_id": report.restaurant_id,
                    "zone": report.zone.value,
                    "photo_url": report.photo_url,
                    "overall_score": report.overall_score,
                    "grade": report.grade,
                    "status": report.status,
                    "model_version": report.model_version,
                    "is_demo": report.is_demo,
                    "disclaimer": report.disclaimer,
                    "limitations": report.limitations,
                }
                res = self.supabase_client.table("assessments").insert(assessment_data).execute()

                # Insert findings
                if report.findings:
                    findings_data = [
                        {
                            "id": f.id,
                            "assessment_id": report.id,
                            "category": f.category,
                            "title": f.title,
                            "description": f.description,
                            "severity": f.severity.value,
                            "confidence": f.confidence,
                            "deduction_points": f.deduction_points,
                            "evidence_description": f.evidence_description,
                            "corrective_recommendation": f.corrective_recommendation,
                        }
                        for f in report.findings
                    ]
                    self.supabase_client.table("findings").insert(findings_data).execute()

                return {
                    "persisted": True,
                    "storage_backend": "supabase_postgresql",
                    "assessment_id": report.id,
                }
            except Exception as e:
                logger.error(f"Error persisting assessment to Supabase: {e}")
                return {
                    "persisted": False,
                    "storage_backend": "in_memory_dev",
                    "error": str(e),
                    "assessment_id": report.id,
                }

        return {
            "persisted": False,
            "storage_backend": "in_memory_dev",
            "message": "Saved to local development store. Supabase cloud credentials not configured.",
            "assessment_id": report.id,
        }

    def get_assessment(self, assessment_id: str) -> Optional[InspectionReport]:
        # Check in-memory store first
        if assessment_id in _IN_MEMORY_STORE:
            return _IN_MEMORY_STORE[assessment_id]

        if self.supabase_client:
            try:
                res = (
                    self.supabase_client.table("assessments")
                    .select("*, findings(*)")
                    .eq("id", assessment_id)
                    .single()
                    .execute()
                )
                if res.data:
                    # Map from db record to InspectionReport
                    data = res.data
                    return InspectionReport(
                        id=data["id"],
                        restaurant_id=data.get("restaurant_id"),
                        zone=data["zone"],
                        photo_url=data["photo_url"],
                        overall_score=data["overall_score"],
                        grade=data["grade"],
                        status=data["status"],
                        model_version=data["model_version"],
                        is_demo=data.get("is_demo", False),
                        disclaimer=data["disclaimer"],
                        limitations=data.get("limitations"),
                        created_at=data["created_at"],
                    )
            except Exception as e:
                logger.error(f"Failed to fetch assessment from Supabase: {e}")

        return None


default_inspection_repo = InspectionRepository()
