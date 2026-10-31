from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers.analysis import router as analysis_router
from app.routers.profile import router as profile_router
from app.routers.export import router as export_router
from app.routers.jobs import router as jobs_router
from app.routers.preparation import router as preparation_router

app = FastAPI(
    title="CareerFit AI",
    version="1.0.0",
    description="AI-powered resume tailoring and career fit platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
app.include_router(analysis_router)
app.include_router(export_router)
app.include_router(jobs_router)
app.include_router(preparation_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "CareerFit AI backend is running"}
