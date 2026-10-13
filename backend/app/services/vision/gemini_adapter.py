import base64
import json
import logging
from typing import List, Optional
import httpx
from app.core.config import settings
from app.models.inspection import FindingSchema, SeverityEnum
from app.services.vision.base import VisionProvider, VisionInferenceResult

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

INSPECTION_PROMPT_TEMPLATE = """
You are an expert commercial food safety and kitchen hygiene visual inspector.
Analyze this kitchen photograph specifically for the zone: '{zone}'.

Assess visible cleanliness only.
Identify any visible hygiene concerns, food safety risks, grease accumulation, improper storage, or lack of sanitation.
Do NOT attempt to diagnose unseen bacteria, microbiological sanitation, or internal food temperatures.

Return a valid JSON object matching this schema:
{{
  "is_inconclusive": false,
  "inconclusive_reason": null,
  "limitations": "Description of any lighting or visual angle limitations",
  "findings": [
    {{
      "id": "finding-1",
      "category": "e.g. Grease Accumulation, Cross-Contamination Risk, Waste Disposal, Surface Sanitation",
      "title": "Short concise summary",
      "description": "Specific visible observation",
      "severity": "critical" | "high" | "medium" | "low",
      "confidence": 0.0 to 1.0,
      "deduction_points": 3.0 to 25.0,
      "evidence_description": "Where in the photo this was observed",
      "corrective_recommendation": "Actionable step to fix the issue",
      "is_critical": true | false
    }}
  ]
}}

If the photograph is not of a commercial/restaurant kitchen, or cannot be assessed at all, set "is_inconclusive" to true and explain in "inconclusive_reason".
"""


class GeminiVisionAdapter(VisionProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: float = 30.0,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.VISION_MODEL_NAME
        self.timeout_seconds = timeout_seconds

    async def analyze_image(self, image_bytes: bytes, zone: str) -> VisionInferenceResult:
        if not self.api_key:
            raise ValueError(
                "Gemini API key is not configured on the backend. "
                "Set GEMINI_API_KEY in the environment or switch AI_VISION_ADAPTER to 'demo'."
            )

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        url = f"{GEMINI_API_BASE}/{self.model_name}:generateContent?key={self.api_key}"

        prompt = INSPECTION_PROMPT_TEMPLATE.format(zone=zone)

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": encoded_image,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload)

            if response.status_code in (401, 403):
                raise RuntimeError(
                    f"Gemini API Authentication Error ({response.status_code}): Invalid or unauthorized API key."
                )
            elif response.status_code == 429:
                raise RuntimeError("Gemini API Rate Limit Exceeded (429): Quota exceeded. Please retry later.")
            elif response.status_code >= 500:
                raise RuntimeError(
                    f"Gemini API Service Unavailable ({response.status_code}): Upstream provider error."
                )
            elif response.status_code != 200:
                raise RuntimeError(
                    f"Gemini API Error ({response.status_code}): {response.text[:200]}"
                )

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("Gemini returned an empty candidate list (content blocked or filtered).")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise ValueError("Gemini returned no text content in output parts.")

            raw_text = parts[0].get("text", "{}")
            parsed_json = json.loads(raw_text)

            is_inconclusive = parsed_json.get("is_inconclusive", False)
            inconclusive_reason = parsed_json.get("inconclusive_reason")
            limitations = parsed_json.get("limitations")

            raw_findings = parsed_json.get("findings", [])
            findings: List[FindingSchema] = []

            for idx, rf in enumerate(raw_findings):
                # Map severity string to enum safely
                raw_sev = str(rf.get("severity", "medium")).lower()
                sev = (
                    SeverityEnum.CRITICAL if "crit" in raw_sev
                    else SeverityEnum.HIGH if "high" in raw_sev
                    else SeverityEnum.LOW if "low" in raw_sev
                    else SeverityEnum.MEDIUM
                )

                findings.append(
                    FindingSchema(
                        id=f"gemini-{idx+1}",
                        category=rf.get("category", "Visible Cleanliness"),
                        title=rf.get("title", "Hygiene observation"),
                        description=rf.get("description", "Visible finding in kitchen zone."),
                        severity=sev,
                        confidence=min(1.0, max(0.0, float(rf.get("confidence", 0.85)))),
                        deduction_points=max(0.0, float(rf.get("deduction_points", 5.0))),
                        evidence_description=rf.get("evidence_description"),
                        corrective_recommendation=rf.get("corrective_recommendation", "Clean and sanitize affected area."),
                        is_critical=bool(rf.get("is_critical", False)),
                    )
                )

            return VisionInferenceResult(
                findings=findings,
                model_version=f"{self.model_name}-live",
                is_demo=False,
                is_inconclusive=is_inconclusive,
                inconclusive_reason=inconclusive_reason,
                limitations=limitations,
            )

        except httpx.TimeoutException:
            raise TimeoutError(f"Gemini API request timed out after {self.timeout_seconds}s.")
        except json.JSONDecodeError as jde:
            raise ValueError(f"Malformed JSON from Gemini model output: {str(jde)}")
