import os
import tempfile
from typing import Callable

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from app.schemas import ExportRequest
from app.services.export_service import export_resume_to_docx, export_resume_to_pdf

router = APIRouter(prefix="/api/export", tags=["export"])


def _build_export(req: ExportRequest, suffix: str, media_type: str, filename: str, exporter: Callable) -> FileResponse:
    file_descriptor, path = tempfile.mkstemp(suffix=suffix)
    os.close(file_descriptor)
    try:
        exporter(req.profile.model_dump(), req.analysis.model_dump(), path)
    except Exception as exc:
        try:
            os.unlink(path)
        except OSError:
            pass
        raise HTTPException(status_code=500, detail=f"Could not create resume export: {exc}") from exc

    return FileResponse(
        path,
        media_type=media_type,
        filename=filename,
        background=BackgroundTask(os.unlink, path),
    )


@router.post("/pdf")
async def export_pdf(req: ExportRequest):
    return _build_export(req, ".pdf", "application/pdf", "resume.pdf", export_resume_to_pdf)


@router.post("/docx")
async def export_docx(req: ExportRequest):
    return _build_export(
        req,
        ".docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "resume.docx",
        export_resume_to_docx,
    )
