from fastapi import APIRouter, HTTPException

from app.schemas import JobDiscoveryRequest, JobDiscoveryResponse
from app.services.job_discovery_service import discover_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/discover", response_model=JobDiscoveryResponse)
async def discover_profile_jobs(request: JobDiscoveryRequest):
    try:
        jobs, total_found, queries, providers, warnings = await discover_jobs(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="The configured job sources could not be reached. Check the backend logs and try again.") from exc

    return JobDiscoveryResponse(
        jobs=jobs,
        total_found=total_found,
        location=request.location,
        country_code=request.country_code.strip().lower(),
        search_queries=queries,
        sources_searched=providers,
        warnings=warnings,
    )
