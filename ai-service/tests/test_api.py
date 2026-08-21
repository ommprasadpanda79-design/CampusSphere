from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_high_risk_profile() -> None:
    response = client.post("/predict-risk", json={
        "attendance_percentage": 58,
        "marks_trend": [78, 68, 57, 45],
        "assignment_engagement_score": 48,
    })
    body = response.json()
    assert response.status_code == 200
    assert body["risk_label"] == "High"
    assert body["risk_score"] >= 65
    assert len(body["contributing_factors"]) == 3


def test_low_risk_profile() -> None:
    response = client.post("/predict-risk", json={
        "attendance_percentage": 94,
        "marks_trend": [70, 76, 82, 88],
        "assignment_engagement_score": 90,
    })
    assert response.status_code == 200
    assert response.json()["risk_label"] == "Low"


def test_rejects_out_of_range_values() -> None:
    response = client.post("/predict-risk", json={
        "attendance_percentage": 110,
        "marks_trend": [80],
        "assignment_engagement_score": 70,
    })
    assert response.status_code == 422

