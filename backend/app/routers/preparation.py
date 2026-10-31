from fastapi import APIRouter, HTTPException

from app.schemas import PreparationRequest, PreparationResponse
from app.services.preparation_service import prepare_for_job

router = APIRouter(prefix="/api/preparation", tags=["preparation"])


@router.post("/plan", response_model=PreparationResponse)
async def create_preparation_plan(request: PreparationRequest):
    try:
        return await prepare_for_job(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not build the preparation plan from the live job sources. Check backend connectivity and try again.") from exc
