import io
import pytest
from PIL import Image, ImageDraw, ImageFilter
from fastapi.testclient import TestClient
from app.main import app
from app.models.inspection import (
    FindingSchema,
    KitchenZoneEnum,
    SeverityEnum,
)
from app.services.image_validator import ImageValidator, default_validator
from app.services.scoring_engine import ScoringEngine
from app.services.vision.mock_adapter import MockDemoVisionAdapter
from app.services.vision.gemini_adapter import GeminiVisionAdapter

client = TestClient(app)


def create_synthetic_image(
    width: int = 400,
    height: int = 300,
    color: tuple = (120, 150, 180),
    add_edges: bool = True,
    fmt: str = "JPEG",
) -> bytes:
    """Creates an in-memory image for automated testing."""
    img = Image.new("RGB", (width, height), color)
    if add_edges:
        draw = ImageDraw.Draw(img)
        # Add high-contrast lines and shapes so edge variance is high (sharp)
        for i in range(0, width, 20):
            draw.line([(i, 0), (i, height)], fill=(255, 255, 255), width=3)
            draw.line([(0, i), (width, i)], fill=(0, 0, 0), width=2)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


# -----------------------------------------------------------------------------
# 1. Image Validation Tests
# -----------------------------------------------------------------------------
def test_valid_image_passes_validation():
    img_bytes = create_synthetic_image(400, 400, add_edges=True)
    res = default_validator.validate_image_bytes(img_bytes)
    assert res.is_valid is True
    assert res.width == 400
    assert res.height == 400
    assert res.format == "JPEG"
    assert len(res.feedback) == 0


def test_empty_image_fails_validation():
    res = default_validator.validate_image_bytes(b"")
    assert res.is_valid is False
    assert any("empty" in fb.lower() for fb in res.feedback)


def test_corrupted_image_fails_validation():
    corrupted_bytes = b"NOT_AN_IMAGE_HEADER_RANDOM_BYTES_12345678"
    res = default_validator.validate_image_bytes(corrupted_bytes)
    assert res.is_valid is False
    assert any("corrupted" in fb.lower() or "invalid" in fb.lower() for fb in res.feedback)


def test_resolution_too_low_fails_validation():
    tiny_bytes = create_synthetic_image(120, 120, add_edges=True)
    res = default_validator.validate_image_bytes(tiny_bytes)
    assert res.is_valid is False
    assert any("resolution too low" in fb.lower() for fb in res.feedback)


def test_dark_image_fails_validation():
    # Very dark image: luminance near 0
    dark_bytes = create_synthetic_image(400, 400, color=(5, 5, 5), add_edges=False)
    res = default_validator.validate_image_bytes(dark_bytes)
    assert res.is_valid is False
    assert any("insufficient lighting" in fb.lower() or "too dark" in fb.lower() for fb in res.feedback)


def test_blurry_flat_image_fails_validation():
    # Heavily blurred image with low edge contrast
    img = Image.new("RGB", (400, 400), (128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.line([(0, 0), (400, 400)], fill=(200, 200, 200), width=10)
    blurred = img.filter(ImageFilter.GaussianBlur(radius=25))
    buf = io.BytesIO()
    blurred.save(buf, format="PNG")
    res = default_validator.validate_image_bytes(buf.getvalue())
    assert res.is_valid is False
    assert any("blurry" in fb.lower() or "sharpness" in fb.lower() for fb in res.feedback)


# -----------------------------------------------------------------------------
# 2. Transparent Scoring Engine Tests
# -----------------------------------------------------------------------------
def test_scoring_deduction_traceability():
    engine = ScoringEngine(base_score=100.0)
    findings = [
        FindingSchema(
            id="f1",
            category="Grease Accumulation",
            title="Grease on filter",
            description="Oil film",
            severity=SeverityEnum.MEDIUM,
            confidence=0.9,
            deduction_points=6.0,
            corrective_recommendation="Clean filter",
        ),
        FindingSchema(
            id="f2",
            category="Sanitization",
            title="Dry towel missing",
            description="No cloth",
            severity=SeverityEnum.LOW,
            confidence=0.85,
            deduction_points=3.0,
            corrective_recommendation="Restock towels",
        ),
    ]

    res = engine.calculate_score(findings)
    assert res.overall_score == 91.0
    assert res.grade == "A"
    assert len(res.deductions) == 2
    assert res.deductions[0].points_deducted == 6.0
    assert res.deductions[1].points_deducted == 3.0
    assert res.has_critical_warning is False


def test_duplicate_findings_deduplicated():
    engine = ScoringEngine(base_score=100.0)
    # Two identical findings in the same category
    findings = [
        FindingSchema(
            id="f1",
            category="Grease Accumulation",
            title="Grease on filter",
            description="First observation",
            severity=SeverityEnum.HIGH,
            confidence=0.9,
            deduction_points=12.0,
            corrective_recommendation="Clean filter",
        ),
        FindingSchema(
            id="f2",
            category="Grease Accumulation",
            title="Grease on filter",
            description="Duplicate report",
            severity=SeverityEnum.HIGH,
            confidence=0.9,
            deduction_points=12.0,
            corrective_recommendation="Clean filter",
        ),
    ]

    res = engine.calculate_score(findings)
    # Should only deduct 12.0 once!
    assert res.overall_score == 88.0
    assert len(res.deductions) == 1


def test_critical_warning_triggered_despite_high_score():
    engine = ScoringEngine(base_score=100.0)
    # One critical pest violation (-25), leaves score at 75 (Grade C), but has_critical_warning MUST be True
    findings = [
        FindingSchema(
            id="f-pest",
            category="Pest Control",
            title="Active rodent droppings behind reach-in cooler",
            description="Visible droppings along floor baseboard",
            severity=SeverityEnum.CRITICAL,
            confidence=0.95,
            deduction_points=25.0,
            corrective_recommendation="Engage licensed pest control immediately",
            is_critical=True,
        )
    ]

    res = engine.calculate_score(findings)
    assert res.overall_score == 75.0
    assert res.has_critical_warning is True
    assert len(res.critical_warnings) >= 1
    assert "CRITICAL CONCERN" in res.critical_warnings[0]


def test_inconclusive_scoring_result():
    engine = ScoringEngine(base_score=100.0)
    res = engine.calculate_score(
        findings=[],
        is_inconclusive=True,
        inconclusive_reason="Angle obscured by steam plume",
    )
    assert res.overall_score is None
    assert res.grade is None
    assert res.is_inconclusive is True
    assert res.status == "inconclusive"
    assert "Angle obscured" in res.inconclusive_reason


# -----------------------------------------------------------------------------
# 3. Vision Provider Architecture Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_mock_vision_adapter_explicit_demo_tagging():
    adapter = MockDemoVisionAdapter()
    img_bytes = create_synthetic_image()
    res = await adapter.analyze_image(img_bytes, zone="equipment")

    assert res.is_demo is True
    assert "demo" in res.model_version.lower()
    assert len(res.findings) >= 1
    assert any("grease" in f.category.lower() for f in res.findings)


@pytest.mark.asyncio
async def test_gemini_adapter_missing_key_raises_error():
    adapter = GeminiVisionAdapter(api_key="")
    img_bytes = create_synthetic_image()
    with pytest.raises(ValueError) as exc:
        await adapter.analyze_image(img_bytes, zone="prep_surface")
    assert "not configured" in str(exc.value).lower()


# -----------------------------------------------------------------------------
# 4. API Endpoints Integration Tests
# -----------------------------------------------------------------------------
def test_api_validate_image_endpoint():
    img_bytes = create_synthetic_image(400, 400, add_edges=True)
    files = {"file": ("kitchen.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/v1/inspections/validate-image", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["width"] == 400
    assert data["format"] == "JPEG"


def test_api_analyze_inspection_endpoint_with_demo_adapter():
    img_bytes = create_synthetic_image(400, 400, add_edges=True)
    files = {"file": ("prep_station.jpg", img_bytes, "image/jpeg")}
    data = {"zone": "prep_surface", "restaurant_id": "test-rest-01"}

    response = client.post("/api/v1/inspections/analyze", data=data, files=files)
    assert response.status_code == 200
    report = response.json()

    assert report["id"].startswith("CP-")
    assert report["zone"] == "prep_surface"
    assert report["is_demo"] is True
    assert report["overall_score"] is not None
    assert report["grade"] in ["A", "B", "C", "D"]
    assert len(report["findings"]) > 0
    assert len(report["deductions"]) > 0
    assert len(report["recommendations"]) > 0
    assert "cleanliness" in report["disclaimer"].lower()
    assert "not establish microbiological sanitation" in report["disclaimer"].lower()

    # Test retrieval of the generated assessment report
    get_res = client.get(f"/api/v1/inspections/{report['id']}")
    assert get_res.status_code == 200
    saved_report = get_res.json()
    assert saved_report["id"] == report["id"]
    assert saved_report["overall_score"] == report["overall_score"]


def test_api_analyze_rejects_corrupted_image():
    files = {"file": ("corrupt.jpg", b"INVALID_BYTES_NOT_AN_IMAGE", "image/jpeg")}
    data = {"zone": "storage"}

    response = client.post("/api/v1/inspections/analyze", data=data, files=files)
    assert response.status_code == 422
    err = response.json()
    assert "validation failed" in str(err).lower()


def test_api_analyze_json_endpoint():
    import base64
    img_bytes = create_synthetic_image(400, 400, add_edges=True)
    b64_str = base64.b64encode(img_bytes).decode("utf-8")

    payload = {
        "zone": "dishwashing",
        "restaurant_id": "test-rest-02",
        "image_base64": b64_str,
    }

    response = client.post("/api/v1/inspections/analyze/json", json=payload)
    assert response.status_code == 200
    report = response.json()
    assert report["zone"] == "dishwashing"
    assert report["is_demo"] is True
    assert len(report["findings"]) > 0

