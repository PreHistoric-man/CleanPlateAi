import uuid
from typing import Dict, List
from app.models.inspection import FindingSchema, SeverityEnum
from app.services.vision.base import VisionProvider, VisionInferenceResult

DEMO_MODEL_VERSION = "demo-fixtures-v1.0"

DEMO_ZONE_FIXTURES: Dict[str, List[FindingSchema]] = {
    "prep_surface": [
        FindingSchema(
            id="demo-prep-01",
            category="Sanitization & Storage",
            title="Damp wiping towel left on stainless food preparation table",
            description="A damp cleaning towel was observed resting directly on the food preparation counter instead of in an approved sanitizing bucket solution.",
            severity=SeverityEnum.LOW,
            confidence=0.92,
            deduction_points=5.0,
            evidence_description="Folded blue microfiber towel near middle prep counter",
            corrective_recommendation="Submerge wiping cloths in dedicated quaternary ammonia or chlorine sanitizer bucket (200 ppm) when not in active use.",
            is_critical=False,
        ),
        FindingSchema(
            id="demo-prep-02",
            category="Cross-Contamination Prevention",
            title="Raw poultry prep board placed adjacent to ready-to-eat salad bowl",
            description="Red raw meat cutting board was within 10 inches of exposed fresh greens without a physical barrier.",
            severity=SeverityEnum.MEDIUM,
            confidence=0.88,
            deduction_points=6.0,
            evidence_description="Proximity between colored cutting station and salad prep bowl",
            corrective_recommendation="Enforce color-coded zones: ensure raw animal protein preparation is segregated by at least 2 feet or in distinct designated work areas.",
            is_critical=False,
        ),
    ],
    "storage": [
        FindingSchema(
            id="demo-storage-01",
            category="Cold Storage Organization",
            title="Uncovered food container on intermediate walk-in shelf",
            description="A plastic gastronorm container of pre-cooked sauce was stored without an airtight lid or food-grade cling film.",
            severity=SeverityEnum.MEDIUM,
            confidence=0.91,
            deduction_points=6.0,
            evidence_description="Open 1/3 GN pan on shelf level 3",
            corrective_recommendation="Cover all prepped foods with fitted lids or food-grade wrap and affix date labels with prep date and shelf life.",
            is_critical=False,
        ),
        FindingSchema(
            id="demo-storage-02",
            category="Storage Sanitation",
            title="Minor condensation pooling on lower refrigeration shelf",
            description="Moisture droplets observed accumulating beneath storage bins on the lowest wire rack.",
            severity=SeverityEnum.LOW,
            confidence=0.85,
            deduction_points=3.0,
            evidence_description="Moisture sheen on bottom shelf tier",
            corrective_recommendation="Wipe shelf dry and inspect refrigerator condensate drain tube for clogs.",
            is_critical=False,
        ),
    ],
    "dishwashing": [
        FindingSchema(
            id="demo-dish-01",
            category="Drainage & Standing Water",
            title="Standing greywater accumulation near dish pit drain",
            description="Puddle of grey rinse water pooling around the floor drain without adequate runoff slope.",
            severity=SeverityEnum.MEDIUM,
            confidence=0.89,
            deduction_points=6.0,
            evidence_description="Water accumulation extending 3 feet from dish pit floor drain",
            corrective_recommendation="Squeegee standing water into the floor drain immediately and inspect floor drain catch basket for food trap blockages.",
            is_critical=False,
        ),
        FindingSchema(
            id="demo-dish-02",
            category="Warewashing Organization",
            title="Clean cookware stacked without full air-drying clearance",
            description="Stainless pans nested tightly while still wet, impeding natural sanitizing air flow.",
            severity=SeverityEnum.LOW,
            confidence=0.87,
            deduction_points=3.0,
            evidence_description="Nested 10-inch sauté pans on drying wire rack",
            corrective_recommendation="Invert and space cookware individually on slatted wire shelves until completely air-dried before stacking.",
            is_critical=False,
        ),
    ],
    "waste_disposal": [
        FindingSchema(
            id="demo-waste-01",
            category="Refuse Containment",
            title="Kitchen refuse receptacle missing secure lid",
            description="A 50L waste bin in the main cooking zone was uncovered during food preparation hours.",
            severity=SeverityEnum.MEDIUM,
            confidence=0.94,
            deduction_points=6.0,
            evidence_description="Open top cylindrical trash can in center line",
            corrective_recommendation="Equip all kitchen waste bins with tight-fitting foot-pedal lids to prevent insect attraction and odor dispersion.",
            is_critical=False,
        ),
    ],
    "equipment": [
        FindingSchema(
            id="demo-equip-01",
            category="Grease Accumulation",
            title="Heavy grease film on exhaust hood baffle filters",
            description="Visible dark amber oil residues coating the louvers of stainless exhaust ventilation filters.",
            severity=SeverityEnum.HIGH,
            confidence=0.93,
            deduction_points=12.0,
            evidence_description="Dark grease film along bottom perimeter of canopy hood baffles",
            corrective_recommendation="Remove hood baffle filters and soak in commercial degreaser vat followed by high-temp dish machine wash.",
            is_critical=False,
        ),
        FindingSchema(
            id="demo-equip-02",
            category="Equipment Cleanliness",
            title="Carbonized food splatters in burner drip trays",
            description="Accumulation of dried food boil-overs beneath gas burners.",
            severity=SeverityEnum.LOW,
            confidence=0.86,
            deduction_points=3.0,
            evidence_description="Carbon deposits on drip tray under rear range burners",
            corrective_recommendation="Remove and scrub burner trays at the end of every evening shift with heavy-duty scouring pad.",
            is_critical=False,
        ),
    ],
}


class MockDemoVisionAdapter(VisionProvider):
    """
    Deterministic mock vision adapter for automated tests and development preview.
    All outputs are explicitly marked as DEMO DATA.
    """

    def __init__(self, model_version: str = DEMO_MODEL_VERSION):
        self.model_version = model_version

    async def analyze_image(self, image_bytes: bytes, zone: str) -> VisionInferenceResult:
        normalized_zone = zone.lower().strip()
        findings = DEMO_ZONE_FIXTURES.get(normalized_zone, DEMO_ZONE_FIXTURES["prep_surface"])

        # Deep copy with unique finding IDs for this assessment
        instance_findings: List[FindingSchema] = []
        for f in findings:
            item_copy = f.model_copy()
            item_copy.id = f"demo-{uuid.uuid4().hex[:8]}"
            instance_findings.append(item_copy)

        return VisionInferenceResult(
            findings=instance_findings,
            model_version=self.model_version,
            is_demo=True,
            is_inconclusive=False,
            inconclusive_reason=None,
            limitations=f"Demonstration fixture generated for zone '{zone}'. For live CV inference, configure GEMINI_API_KEY.",
        )
