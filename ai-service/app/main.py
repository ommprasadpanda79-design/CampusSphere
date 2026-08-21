from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .scoring import score_risk

app = FastAPI(
    title="CampusSphere AI Insights",
    version="1.0.0",
    description="Explainable student risk scoring service.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class RiskRequest(BaseModel):
    attendance_percentage: float = Field(ge=0, le=100)
    marks_trend: list[float] = Field(default_factory=list, max_length=20)
    assignment_engagement_score: float = Field(ge=0, le=100)

    @field_validator("marks_trend")
    @classmethod
    def validate_mark_range(cls, scores: list[float]) -> list[float]:
        if any(score < 0 or score > 100 for score in scores):
            raise ValueError("every mark must be between 0 and 100")
        return scores


class RiskResponse(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_label: str
    contributing_factors: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "campussphere-ai"}


@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest) -> RiskResponse:
    result = score_risk(
        payload.attendance_percentage,
        payload.marks_trend,
        payload.assignment_engagement_score,
    )
    return RiskResponse(
        risk_score=result.risk_score,
        risk_label=result.risk_label,
        contributing_factors=result.contributing_factors,
    )

