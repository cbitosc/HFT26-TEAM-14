from fastapi import APIRouter

from app.schemas import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import analyze_profile_vs_jd

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalysisRequest):
    return analyze_profile_vs_jd(req)
