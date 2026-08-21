from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class RiskResult:
    risk_score: int
    risk_label: str
    contributing_factors: list[str]


def _linear_slope(values: Sequence[float]) -> float:
    """Return the least-squares slope for equally spaced observations."""
    if len(values) < 2:
        return 0.0
    x_mean = (len(values) - 1) / 2
    y_mean = sum(values) / len(values)
    numerator = sum((index - x_mean) * (value - y_mean) for index, value in enumerate(values))
    denominator = sum((index - x_mean) ** 2 for index in range(len(values)))
    return numerator / denominator if denominator else 0.0


def score_risk(
    attendance_percentage: float,
    marks_trend: Sequence[float],
    assignment_engagement_score: float,
) -> RiskResult:
    """Transparent baseline scorer. All inputs and the output use a 0-100 scale."""
    risk = 0.0
    factors: list[str] = []

    if attendance_percentage < 75:
        attendance_penalty = 40 + min(25, (75 - attendance_percentage) * 1.4)
        risk += attendance_penalty
        factors.append(f"Attendance is below the 75% threshold ({attendance_percentage:.1f}%)")
    elif attendance_percentage < 85:
        risk += (85 - attendance_percentage) * 1.5
        factors.append(f"Attendance has limited headroom ({attendance_percentage:.1f}%)")

    recent_scores = list(marks_trend)[-4:]
    slope = _linear_slope(recent_scores)
    if slope < -1:
        risk += min(25, abs(slope) * 3)
        factors.append(f"Recent marks are declining ({slope:.1f} points per assessment)")
    elif recent_scores and sum(recent_scores) / len(recent_scores) < 55:
        risk += 16
        factors.append("Recent marks average is below 55%")

    if assignment_engagement_score < 60:
        risk += min(20, (60 - assignment_engagement_score) * 0.6 + 5)
        factors.append(f"Assignment engagement is low ({assignment_engagement_score:.1f}%)")
    elif assignment_engagement_score < 75:
        risk += 5
        factors.append(f"Assignment engagement could improve ({assignment_engagement_score:.1f}%)")

    final_score = round(max(0, min(100, risk)))
    label = "High" if final_score >= 65 else "Medium" if final_score >= 35 else "Low"
    if not factors:
        factors.append("Attendance, marks, and assignment engagement are stable")

    # A trained model can replace this rule function here (for example,
    # model.predict_proba(feature_vector)) while keeping RiskResult and the API contract unchanged.
    return RiskResult(final_score, label, factors)

