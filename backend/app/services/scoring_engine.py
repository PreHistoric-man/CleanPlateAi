from typing import List, Dict, Tuple, Optional, Set
from app.models.inspection import FindingSchema, SeverityEnum, ScoringDeduction, ScoringResult

# Configurable deduction weights by severity
DEFAULT_SEVERITY_DEDUCTIONS: Dict[SeverityEnum, float] = {
    SeverityEnum.CRITICAL: 25.0,
    SeverityEnum.HIGH: 12.0,
    SeverityEnum.MEDIUM: 6.0,
    SeverityEnum.LOW: 3.0,
}

# Critical violation categories that trigger urgent safety warnings
CRITICAL_VIOLATION_KEYWORDS = {
    "pest",
    "rodent",
    "cockroach",
    "sewage",
    "standing greywater",
    "raw poultry over ready-to-eat",
    "toxic chemical",
    "mold growth",
}


class ScoringEngine:
    """
    Transparent, deterministic CleanPlate hygiene scoring engine.
    Calculates itemized point deductions and letter grades.
    Scoring is decoupled from model inference and strictly reproducible.
    """

    def __init__(
        self,
        base_score: float = 100.0,
        severity_weights: Optional[Dict[SeverityEnum, float]] = None,
        rule_version: str = "scoring-rules-v1.0",
    ):
        self.base_score = base_score
        self.severity_weights = severity_weights or DEFAULT_SEVERITY_DEDUCTIONS
        self.rule_version = rule_version

    def _generate_finding_fingerprint(self, finding: FindingSchema) -> str:
        """
        Creates a normalized key to detect and prevent duplicate penalties
        for the same underlying violation.
        """
        norm_cat = finding.category.strip().lower()
        norm_title = finding.title.strip().lower()
        return f"{norm_cat}::{norm_title}"

    def calculate_score(
        self,
        findings: List[FindingSchema],
        is_inconclusive: bool = False,
        inconclusive_reason: Optional[str] = None,
    ) -> ScoringResult:
        if is_inconclusive:
            return ScoringResult(
                overall_score=None,
                grade=None,
                has_critical_warning=False,
                critical_warnings=[],
                deductions=[],
                is_inconclusive=True,
                inconclusive_reason=inconclusive_reason or "Photograph quality or angle is insufficient to determine hygiene reliably.",
                status="inconclusive",
                rule_version=self.rule_version,
            )

        deductions: List[ScoringDeduction] = []
        critical_warnings: List[str] = []
        seen_fingerprints: Set[str] = set()
        current_score = self.base_score

        for finding in findings:
            fingerprint = self._generate_finding_fingerprint(finding)

            # Check for critical safety triggers
            is_critical = finding.severity == SeverityEnum.CRITICAL or any(
                kw in (finding.title + " " + finding.description).lower()
                for kw in CRITICAL_VIOLATION_KEYWORDS
            )

            if is_critical or finding.is_critical:
                warn_msg = f"CRITICAL CONCERN: {finding.title} — {finding.corrective_recommendation}"
                if warn_msg not in critical_warnings:
                    critical_warnings.append(warn_msg)

            # Deduplication: prevent deducting twice for duplicate findings
            if fingerprint in seen_fingerprints:
                continue

            seen_fingerprints.add(fingerprint)

            # Calculate deduction points based on documented severity weight
            # If the finding specifies custom deduction, use min of custom and severity cap
            base_deduction = self.severity_weights.get(finding.severity, 3.0)
            deduction_points = (
                finding.deduction_points if finding.deduction_points > 0 else base_deduction
            )

            current_score -= deduction_points

            deductions.append(
                ScoringDeduction(
                    finding_id=finding.id,
                    category=finding.category,
                    title=finding.title,
                    severity=finding.severity,
                    points_deducted=round(deduction_points, 1),
                    rule_applied=f"Rule {finding.severity.value.upper()}: -{deduction_points:.1f} pts for '{finding.category}'",
                )
            )

        # Clamp score between 0.0 and 100.0
        final_score = max(0.0, min(100.0, round(current_score, 1)))

        # Assign letter grade
        if final_score >= 90.0:
            grade = "A"
        elif final_score >= 80.0:
            grade = "B"
        elif final_score >= 70.0:
            grade = "C"
        else:
            grade = "D"

        has_critical_warning = len(critical_warnings) > 0

        return ScoringResult(
            overall_score=final_score,
            grade=grade,
            has_critical_warning=has_critical_warning,
            critical_warnings=critical_warnings,
            deductions=deductions,
            is_inconclusive=False,
            inconclusive_reason=None,
            status="completed",
            rule_version=self.rule_version,
        )


default_scoring_engine = ScoringEngine()
