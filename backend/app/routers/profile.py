from fastapi import APIRouter
from app.schemas import ProfileInput

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.post("/save")
async def save_profile(profile: ProfileInput):
    return {
        "message": "Profile saved successfully",
        "profile": profile.model_dump()
    }
