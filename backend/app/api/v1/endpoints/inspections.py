import base64
import uuid
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from app.core.config import settings
from app.models.inspection import (
    ImageValidationResult,
    InspectionAnalyzeRequest,
    InspectionReport,
    KitchenZoneEnum,
)
from app.services.image_validator import default_validator
from app.services.scoring_engine import default_scoring_engine
from app.services.vision.factory import get_vision_adapter
from app.services.inspection_repository import default_inspection_repo

router = APIRouter()


@router.post("/validate-image", response_model=ImageValidationResult)
async def validate_image(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
):
    """
    Validates uploaded image format, size, dimensions, sharpness, and brightness.
    """
    if file:
        image_bytes = await file.read()
    elif image_base64:
        try:
            # Handle data URI prefix if present
            clean_b64 = image_base64.split(",")[-1]
            image_bytes = base64.b64decode(clean_b64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoded image data.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either an uploaded file or base64 image data.",
        )

    return default_validator.validate_image_bytes(image_bytes)


@router.post("/analyze", response_model=InspectionReport)
async def analyze_kitchen_inspection(
    zone: KitchenZoneEnum = Form(...),
    restaurant_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
):
    """
    Analyzes kitchen zone photograph for visible hygiene issues and computes transparent score.
    """
    image_bytes = b""
    photo_display_url = image_url or "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800"

    if file:
        image_bytes = await file.read()
        photo_display_url = f"uploaded://{file.filename}"
    elif image_base64:
        try:
            clean_b64 = image_base64.split(",")[-1]
            image_bytes = base64.b64decode(clean_b64)
            photo_display_url = "data:image/jpeg;base64,..."
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoded image payload.",
            )
    elif image_url:
        # Download image from URL
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(image_url)
                if res.status_code == 200:
                    image_bytes = res.content
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to fetch image from provided URL (status {res.status_code}).",
                    )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to retrieve image from URL: {str(e)}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide an image file, image_base64, or image_url.",
        )

    # 1. Run Image Validation
    validation_res = default_validator.validate_image_bytes(image_bytes)
    if not validation_res.is_valid:
        # Return 422 with validation errors
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Image validation failed. Photograph is unsuitable for inspection.",
                "feedback": validation_res.feedback,
                "validation": validation_res.model_dump(),
            },
        )

    # 2. Run Vision Provider Inference
    adapter = get_vision_adapter()
    try:
        inference_res = await adapter.analyze_image(image_bytes, zone.value)
    except TimeoutError as te:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"AI Vision provider timed out: {str(te)}",
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI Vision configuration or output error: {str(ve)}",
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Vision provider failed: {str(re)}",
        )

    # 3. Compute Transparent Scoring
    scoring_res = default_scoring_engine.calculate_score(
        findings=inference_res.findings,
        is_inconclusive=inference_res.is_inconclusive,
        inconclusive_reason=inference_res.inconclusive_reason,
    )

    # 4. Extract Actionable Recommendations
    recommendations = [
        f.corrective_recommendation
        for f in inference_res.findings
        if f.corrective_recommendation
    ]

    # 5. Assemble Assessment Report
    assessment_id = f"CP-{uuid.uuid4().hex[:10].upper()}"
    report = InspectionReport(
        id=assessment_id,
        restaurant_id=restaurant_id,
        zone=zone,
        photo_url=photo_display_url,
        overall_score=scoring_res.overall_score,
        grade=scoring_res.grade,
        status=scoring_res.status,
        model_version=inference_res.model_version,
        is_demo=inference_res.is_demo,
        has_critical_warning=scoring_res.has_critical_warning,
        critical_warnings=scoring_res.critical_warnings,
        findings=inference_res.findings,
        deductions=scoring_res.deductions,
        recommendations=recommendations,
        disclaimer=settings.DISCLAIMER_TEXT,
        limitations=inference_res.limitations or "Visible kitchen surfaces only. Cannot verify microbiological sanitization.",
    )

    # 6. Persist to storage repository
    default_inspection_repo.save_assessment(report)

    return report


@router.post("/analyze/json", response_model=InspectionReport)
async def analyze_kitchen_inspection_json(payload: InspectionAnalyzeRequest):
    """
    JSON version of kitchen inspection analysis.
    """
    return await analyze_kitchen_inspection(
        zone=payload.zone,
        restaurant_id=payload.restaurant_id,
        file=None,
        image_base64=payload.image_base64,
        image_url=payload.image_url,
    )


@router.get("/{inspection_id}", response_model=InspectionReport)
async def get_inspection_report(inspection_id: str):
    """
    Retrieves an existing kitchen inspection assessment report.
    """
    report = default_inspection_repo.get_assessment(inspection_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection assessment with ID '{inspection_id}' not found.",
        )
    return report
