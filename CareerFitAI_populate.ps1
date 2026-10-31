# CareerFit AI - one-run project file generator
# Save this script as populate.ps1 in the careerfit-ai project root.
# It creates the required folders and writes the project files in place.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
    throw "Save populate.ps1 inside your careerfit-ai project folder, then run it again."
}
$root = [System.IO.Path]::GetFullPath($root)

Write-Host "Project folder: $root" -ForegroundColor Cyan
Write-Host "Existing files with matching names will be overwritten." -ForegroundColor Yellow
$confirmation = Read-Host "Type YES to continue"
if ($confirmation -cne "YES") {
    Write-Host "Cancelled. No files were written." -ForegroundColor Yellow
    exit
}

# Create root
New-Item -ItemType Directory -Force -Path $root | Out-Null

# Backend folders
New-Item -ItemType Directory -Force -Path "$root\backend\app\services" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\backend\app\routers" | Out-Null

# Frontend folders
New-Item -ItemType Directory -Force -Path "$root\frontend\app\dashboard" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\frontend\app\builder" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\frontend\app\analyze" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\frontend\components" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\frontend\lib" | Out-Null

# ----------- backend/.env.example -----------
@'
FEATHERLESS_API_KEY=your_featherless_api_key_here

FEATHERLESS_BASE_URL=https://api.featherless.ai/v1

FEATHERLESS_MODEL=Qwen/Qwen2.5-7B-Instruct

APP_ENV=development

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\backend\.env.example" -Encoding UTF8

# Create backend/.env from its example only when it does not already exist.
if (-not (Test-Path -LiteralPath "$root\backend\.env")) {
    Copy-Item -LiteralPath "$root\backend\.env.example" -Destination "$root\backend\.env"
}

# ----------- backend/app/config.py -----------
@'

import os
from pathlib import Path
from dotenv import load_dotenv

# Locate backend/.env
BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"

# Load environment variables
load_dotenv(dotenv_path=ENV_FILE, override=True)

# Featherless AI configuration
FEATHERLESS_API_KEY = os.getenv(
    "FEATHERLESS_API_KEY", ""
).strip()

FEATHERLESS_BASE_URL = os.getenv(
    "FEATHERLESS_BASE_URL",
    "https://api.featherless.ai/v1"
).strip().rstrip("/")

FEATHERLESS_MODEL = os.getenv(
    "FEATHERLESS_MODEL",
    "Qwen/Qwen2.5-7B-Instruct"
).strip()

# Application configuration
APP_ENV = os.getenv("APP_ENV", "development")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
]
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\backend\app\config.py" -Encoding UTF8

# ----------- backend/app/main.py ----------- 
@'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS

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

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "CareerFit AI backend is running"}
'@ | Set-Content -Path "$root\backend\app\main.py" -Encoding UTF8

# ----------- backend/app/schemas.py ----------- 
@'
from typing import List, Optional
from pydantic import BaseModel

class ExperienceEntry(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    bullets: List[str] = []

class ProjectEntry(BaseModel):
    name: str = ""
    description: str = ""
    tech_stack: List[str] = []
    impact: str = ""

class EducationEntry(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""

class ProfileInput(BaseModel):
    name: str = ""
    email: Optional[str] = ""
    location: Optional[str] = ""
    current_title: Optional[str] = ""
    years_experience: int = 0
    summary: str = ""
    skills: List[str] = []
    experience: List[ExperienceEntry] = []
    projects: List[ProjectEntry] = []
    education: List[EducationEntry] = []
    certifications: List[str] = []

class JDInput(BaseModel):
    raw_text: str = ""
    url: Optional[str] = ""
    title: Optional[str] = ""

class AnalysisRequest(BaseModel):
    profile: ProfileInput
    jd: JDInput

class SkillGap(BaseModel):
    skill: str
    importance: str
    reason: str
    recommended_learning_path: str = ""

class StrongSkill(BaseModel):
    skill: str
    match_strength: str

class JobRecommendation(BaseModel):
    role: str
    fit_score: int
    reasons: List[str]

class SkillRoadmapItem(BaseModel):
    skill: str
    priority: str
    timeline: str
    reason: str

class ResumeSuggestion(BaseModel):
    section: str
    content: str
    score_delta: int

class AnalysisResponse(BaseModel):
    match_score: int
    summary: str
    strong_skills: List[StrongSkill] = []
    missing_skills: List[SkillGap] = []
    keyword_gap: List[str] = []
    description_fit: str = ""
    skill_roadmap: List[SkillRoadmapItem] = []
    job_recommendations: List[JobRecommendation] = []
    suggestions: List[ResumeSuggestion] = []
    resume_summary_rewrite: str = ""

class ExportRequest(BaseModel):
    profile: ProfileInput
    analysis: AnalysisResponse
'@ | Set-Content -Path "$root\backend\app\schemas.py" -Encoding UTF8

# ----------- backend/app/services/__init__.py ----------- 
@'
# service package
'@ | Set-Content -Path "$root\backend\app\services\__init__.py" -Encoding UTF8

# ----------- backend/app/services/analysis_service.py -----------
@'
import json
import re
from typing import List, Dict, Any
from openai import OpenAI

from app.config import (
    FEATHERLESS_API_KEY,
    FEATHERLESS_BASE_URL,
    FEATHERLESS_MODEL
)

COMMON_TECH_SKILLS = {
    "python", "javascript", "typescript", "react", "nextjs", "node", "sql", "java", "c++", "go", "rust",
    "api", "rest", "graphql", "docker", "kubernetes", "aws", "azure", "gcp", "redis", "postgresql",
    "machine learning", "ml", "deep learning", "pytorch", "tensorflow", "llm", "rag", "nlp", "prompt engineering",
    "data analysis", "analytics", "power bi", "tableau", "spark", "hadoop", "dbt", "airflow", "product strategy",
    "vector databases", "mcp", "agentic ai", "ai", "fastapi", "scikit-learn", "pandas", "statistics",
    "microservices", "system design", "css", "ui", "ux", "responsive design", "stakeholder management",
    "user research", "prioritization", "experimentation", "backend"
}

ROLE_SKILL_LIBRARY = {
    "software_engineer": ["python", "javascript", "typescript", "react", "node", "sql", "api", "rest", "backend", "system design"],
    "data_scientist": ["python", "sql", "machine learning", "statistics", "pandas", "scikit-learn", "data analysis", "experimentation"],
    "ai_engineer": ["python", "machine learning", "llm", "prompt engineering", "pytorch", "tensorflow", "rag", "vector databases", "mlops"],
    "product_manager": ["product strategy", "roadmaps", "stakeholder management", "analytics", "sql", "user research", "prioritization"],
    "backend_engineer": ["python", "java", "sql", "microservices", "api", "docker", "kubernetes", "redis"],
    "frontend_engineer": ["javascript", "typescript", "react", "nextjs", "css", "ui", "ux", "responsive design"]
}

from app.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    SkillGap,
    StrongSkill,
    JobRecommendation,
    SkillRoadmapItem,
    ResumeSuggestion,
)

def generate_llm_analysis(
    profile: Dict[str, Any],
    jd_text: str
) -> Dict[str, Any]:

    # Use fallback analysis if no Featherless API key is configured
    if not FEATHERLESS_API_KEY:
        return {
            "match_score": 75,
            "summary": "Strong overall profile with targeted improvements available.",
            "strong_skills": ["python", "sql", "react"],
            "missing_skills": ["llm", "rag", "prompt engineering"],
            "keyword_gap": ["llm", "rag", "ai product strategy"],
            "description_fit": "Good role alignment with opportunity to strengthen keyword coverage and AI-related achievements.",
            "resume_summary_rewrite": "Technology-focused professional with strong execution, product thinking, and measurable results in fast-paced technical environments.",
            "job_recommendations": ["AI Engineer", "Backend Engineer"],
            "skill_roadmap": ["LLM", "RAG", "Prompt Engineering"]
        }

    # Prepare candidate profile
    safe_profile = {
        key: value
        for key, value in profile.items()
        if key not in {"name", "email", "location"}
    }

    # Prepare AI prompt
    prompt = f"""
    You are an expert ATS resume coach and career strategist.

    Analyze the candidate profile against the job description.

    Return ONLY a valid JSON object.
    Do not include Markdown code fences.

    Return this exact structure:

    {{
        "match_score": 0,
        "summary": "Explanation of candidate-job fit",
        "strong_skills": ["skill1", "skill2"],
        "missing_skills": ["skill1", "skill2"],
        "keyword_gap": ["keyword1", "keyword2"],
        "description_fit": "Detailed explanation",
        "resume_summary_rewrite": "Improved professional summary",
        "job_recommendations": ["role1", "role2"],
        "skill_roadmap": ["skill1", "skill2"]
    }}

    Rules:
    - Do not invent candidate experience or qualifications.
    - Distinguish existing skills from missing skills.
    - Recommend realistic learning priorities.
    - Never fabricate achievements or measurable results.
    - Keep recommendations relevant to the supplied job description.

    Candidate profile:
    {json.dumps(safe_profile, indent=2)}

    Job description:
    {jd_text}
    """

    # Create Featherless AI client
    client = OpenAI(
        base_url=FEATHERLESS_BASE_URL,
        api_key=FEATHERLESS_API_KEY,
        timeout=90.0,
        max_retries=1
    )

    try:
        response = client.chat.completions.create(
            model=FEATHERLESS_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert resume analyst. "
                        "Return valid JSON only."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1500
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "Featherless returned an empty response."
            )

        # Remove optional Markdown code fences
        content = content.strip()

        if content.startswith("```"):
            content = re.sub(
                r"^```(?:json)?\s*|\s*```$",
                "",
                content,
                flags=re.IGNORECASE
            ).strip()

        # Extract JSON object
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1:
            raise ValueError(
                "AI did not return a valid JSON object."
            )

        result = json.loads(content[start:end + 1])

        if not isinstance(result, dict):
            raise ValueError(
                "AI response must be a JSON object."
            )

        return result

    except Exception as exc:
        raise RuntimeError(
            f"Featherless AI analysis failed: {type(exc).__name__}: {exc}"
        ) from exc


def normalize_skill(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s+/.-]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text

def skill_tokens_from_text(text: str) -> List[str]:
    words = re.findall(r"[A-Za-z0-9+/.-]+", text.lower())
    cleaned = []
    for token in words:
        token = normalize_skill(token)
        if token and len(token) > 2:
            cleaned.append(token)
    return cleaned

def extract_skills_from_profile(profile: Dict[str, Any]) -> List[str]:
    combined = [str(value) for value in profile.get("skills", []) + profile.get("certifications", [])]

    for exp in profile.get("experience", []):
        combined.extend(str(exp.get(key, "")) for key in ("role", "company"))
        combined.extend(str(value) for value in exp.get("bullets", []))

    for proj in profile.get("projects", []):
        combined.extend(str(value) for value in proj.get("tech_stack", []))
        combined.append(str(proj.get("description", "")))

    return extract_known_skills(" ".join(combined))

def extract_known_skills(text: str) -> List[str]:
    normalized_text = normalize_skill(text)
    skills = set(skill_tokens_from_text(text)) & COMMON_TECH_SKILLS
    for skill in COMMON_TECH_SKILLS:
        normalized_skill = normalize_skill(skill)
        if re.search(r"(?<![a-z0-9])" + re.escape(normalized_skill) + r"(?![a-z0-9])", normalized_text):
            skills.add(normalized_skill)
    return sorted(skills)

def extract_jd_skills(jd_text: str) -> List[str]:
    return extract_known_skills(jd_text)

def compute_score(profile_skills: List[str], jd_skills: List[str]) -> int:
    profile_set = {normalize_skill(s) for s in profile_skills}
    jd_set = {normalize_skill(s) for s in jd_skills}
    if not jd_set:
        return 0
    overlap = profile_set & jd_set
    score = round((len(overlap) / max(len(jd_set), 1)) * 100)
    return max(0, min(100, score))

def build_missing_skills(profile_skills: List[str], jd_skills: List[str]) -> List[SkillGap]:
    profile_set = {normalize_skill(s) for s in profile_skills}
    jd_set = {normalize_skill(s) for s in jd_skills}
    missing = []

    for skill in sorted(jd_set - profile_set):
        if skill:
            missing.append(
                SkillGap(
                    skill=skill,
                    importance="High" if skill in {"python", "sql", "llm", "rag", "mlops", "prompt engineering"} else "Medium",
                    reason=f"Target role appears to require {skill}, which is not currently reflected in your profile.",
                    recommended_learning_path=f"Practice {skill} using small projects, guided learning, and portfolio work."
                )
            )

    return missing[:6]

def build_strong_skills(profile_skills: List[str], jd_skills: List[str]) -> List[StrongSkill]:
    profile_set = {normalize_skill(s) for s in profile_skills}
    jd_set = {normalize_skill(s) for s in jd_skills}
    common = sorted(profile_set & jd_set)
    return [StrongSkill(skill=s, match_strength="strong") for s in common[:6]]

def recommend_roles(profile_skills: List[str], jd_text: str) -> List[JobRecommendation]:
    profile_set = {normalize_skill(s) for s in profile_skills}
    jd_lower = jd_text.lower()
    roles = []

    for role, role_skills in ROLE_SKILL_LIBRARY.items():
        role_skill_set = {normalize_skill(s) for s in role_skills}
        overlap = len(profile_set & role_skill_set)
        score = round((overlap / max(len(role_skill_set), 1)) * 100)

        if score >= 35:
            reasons = []
            if "python" in profile_set and "python" in role_skill_set:
                reasons.append("Strong Python foundation")
            if "sql" in profile_set and "sql" in role_skill_set:
                reasons.append("Good SQL capability")
            if "llm" in role_skill_set or "ai" in jd_lower:
                reasons.append("AI-alignment based on role expectations")
            if not reasons:
                reasons.append("Good role alignment based on your skills")
            
            roles.append(JobRecommendation(role=role.replace("_", " ").title(), fit_score=score, reasons=reasons))

    roles.sort(key=lambda r: r.fit_score, reverse=True)
    return roles[:4]

def build_skill_roadmap(profile_skills: List[str], jd_skills: List[str]) -> List[SkillRoadmapItem]:
    profile_set = {normalize_skill(s) for s in profile_skills}
    jd_set = {normalize_skill(s) for s in jd_skills}
    missing = sorted(jd_set - profile_set)
    roadmap = []

    for i, skill in enumerate(missing[:5], start=1):
        roadmap.append(
            SkillRoadmapItem(
                skill=skill,
                priority="High" if i <= 2 else "Medium",
                timeline="0-30 days" if i <= 2 else "30-90 days",
                reason=f"Relevant to the target role and currently missing from your profile."
            )
        )

    return roadmap

def build_resume_suggestions(profile: Dict[str, Any], jd_text: str) -> List[ResumeSuggestion]:
    suggestions = []
    summary = profile.get("summary", "")

    if not summary:
        suggestions.append(
            ResumeSuggestion(
                section="Summary",
                content="Technology-driven professional with strong product thinking, measurable impact, and execution across software, data, and AI-enabled workflows.",
                score_delta=12
            )
        )

    if "ai" in jd_text.lower() or "llm" in jd_text.lower():
        suggestions.append(
            ResumeSuggestion(
                section="Experience",
                content="Delivered AI-enabled products and workflows, improved product efficiency, and translated business goals into measurable technical outcomes.",
                score_delta=18
            )
        )

    suggestions.append(
        ResumeSuggestion(
            section="Projects",
            content="Built and shipped production-ready, user-impacting projects using modern engineering practices, testing, deployment, and performance optimization.",
            score_delta=10
        )
    )

    return suggestions[:3]

def analyze_profile_vs_jd(request: AnalysisRequest) -> AnalysisResponse:
    profile = request.profile.model_dump()
    jd_text = request.jd.raw_text or ""

    profile_skills = extract_skills_from_profile(profile)
    jd_skills = extract_jd_skills(jd_text)

    score = compute_score(profile_skills, jd_skills)
    missing_skills = build_missing_skills(profile_skills, jd_skills)
    strong_skills = build_strong_skills(profile_skills, jd_skills)
    roadmap = build_skill_roadmap(profile_skills, jd_skills)
    recommendations = recommend_roles(profile_skills, jd_text)
    suggestions = build_resume_suggestions(profile, jd_text)

    llm_data = generate_llm_analysis(profile, jd_text)

    return AnalysisResponse(
        match_score=score,
        summary=llm_data.get("summary", "Strong fit with targeted improvement opportunities."),
        strong_skills=strong_skills,
        missing_skills=missing_skills,
        keyword_gap=llm_data.get("keyword_gap", [])[:5],
        description_fit=llm_data.get("description_fit", "Good alignment but some keyword and impact improvements are recommended."),
        skill_roadmap=[
            SkillRoadmapItem(
                skill=item,
                priority="High" if i == 0 else "Medium",
                timeline="0-30 days" if i == 0 else "30-90 days",
                reason="Relevant to the target role and current profile gap."
            )
            for i, item in enumerate(llm_data.get("skill_roadmap", [])[:5])
        ],
        job_recommendations=recommendations,
        suggestions=suggestions,
        resume_summary_rewrite=llm_data.get("resume_summary_rewrite", "Technology-focused professional with strong problem-solving, execution, and delivery across modern products and workflows.")
    )
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\backend\app\services\analysis_service.py" -Encoding UTF8

# ----------- backend/app/services/export_service.py ----------- 
@'
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from io import BytesIO

def export_resume_to_docx(profile: dict, analysis: dict, file_path: str):
    doc = Document()
    doc.add_heading(profile.get("name", "Candidate"), level=1)

    if profile.get("current_title"):
        doc.add_paragraph(profile["current_title"])

    if profile.get("summary"):
        doc.add_paragraph(profile["summary"])

    doc.add_heading("Skills", level=2)
    doc.add_paragraph(", ".join(profile.get("skills", [])))

    doc.add_heading("Experience", level=2)
    for item in profile.get("experience", []):
        doc.add_paragraph(f"{item.get('role', '')} | {item.get('company', '')} | {item.get('duration', '')}")
        for bullet in item.get("bullets", []):
            doc.add_paragraph(f"- {bullet}")

    doc.add_heading("Projects", level=2)
    for p in profile.get("projects", []):
        doc.add_paragraph(p.get("name", ""))
        doc.add_paragraph(p.get("description", ""))
        doc.add_paragraph("Tech: " + ", ".join(p.get("tech_stack", [])))

    doc.add_heading("JD Match", level=2)
    doc.add_paragraph(f"Match Score: {analysis.get('match_score', 0)}%")
    doc.add_paragraph(f"Skill gaps: {', '.join([s['skill'] for s in analysis.get('missing_skills', [])][:5])}")

    doc.save(file_path)

def export_resume_to_pdf(profile: dict, analysis: dict, file_path: str):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        title=f"{profile.get('name', 'Resume')} Resume"
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(profile.get("name", "Candidate"), styles["Title"]))
    if profile.get("current_title"):
        story.append(Paragraph(profile.get("current_title"), styles["Heading2"]))
    if profile.get("summary"):
        story.append(Paragraph(profile["summary"], styles["BodyText"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Skills", styles["Heading2"]))
    story.append(Paragraph(", ".join(profile.get("skills", [])), styles["BodyText"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Experience", styles["Heading2"]))
    for item in profile.get("experience", []):
        story.append(Paragraph(f"{item.get('role')} | {item.get('company')} | {item.get('duration')}", styles["Heading3"]))
        for bullet in item.get("bullets", []):
            story.append(Paragraph(f"- {bullet}", styles["BodyText"]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("JD Match", styles["Heading2"]))
    story.append(Paragraph(f"Match score: {analysis.get('match_score', 0)}%", styles["BodyText"]))
    story.append(Paragraph(f"Missing skills: {', '.join([s['skill'] for s in analysis.get('missing_skills', [])][:5])}", styles["BodyText"]))

    doc.build(story)
    with open(file_path, "wb") as f:
        f.write(buffer.getvalue())
'@ | Set-Content -Path "$root\backend\app\services\export_service.py" -Encoding UTF8

# ----------- backend/app/services/recommendation_service.py ----------- 
@'
from typing import List, Dict

def get_role_recommendations(profile_skills: List[str]) -> List[Dict]:
    profile_lower = {s.lower() for s in profile_skills}

    role_profiles = {
        "AI Engineer": ["python", "llm", "ml", "sql", "pytorch", "rag"],
        "Backend Engineer": ["python", "sql", "api", "docker", "aws"],
        "Full Stack Engineer": ["javascript", "typescript", "react", "api", "sql"],
        "Data Scientist": ["python", "sql", "machine learning", "analytics", "pandas"],
        "Product Engineer": ["product strategy", "sql", "analytics", "python", "react"]
    }

    recommendations = []
    for role, required in role_profiles.items():
        overlap = len(profile_lower & set(required))
        score = round((overlap / max(len(required), 1)) * 100)
        if score >= 35:
            recommendations.append({
                "role": role,
                "fit_score": score
            })

    return sorted(recommendations, key=lambda x: x["fit_score"], reverse=True)[:4]
'@ | Set-Content -Path "$root\backend\app\services\recommendation_service.py" -Encoding UTF8

# ----------- backend/app/routers/__init__.py ----------- 
@'
# router package
'@ | Set-Content -Path "$root\backend\app\routers\__init__.py" -Encoding UTF8

# ----------- backend/app/routers/analysis.py ----------- 
@'
from fastapi import APIRouter

from app.schemas import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import analyze_profile_vs_jd

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalysisRequest):
    return analyze_profile_vs_jd(req)
'@ | Set-Content -Path "$root\backend\app\routers\analysis.py" -Encoding UTF8

# ----------- backend/app/routers/profile.py ----------- 
@'
from fastapi import APIRouter
from app.schemas import ProfileInput

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.post("/save")
async def save_profile(profile: ProfileInput):
    return {
        "message": "Profile saved successfully",
        "profile": profile.model_dump()
    }
'@ | Set-Content -Path "$root\backend\app\routers\profile.py" -Encoding UTF8

# ----------- backend/app/routers/export.py ----------- 
@'
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.schemas import ExportRequest
from app.services.export_service import export_resume_to_docx, export_resume_to_pdf

router = APIRouter(prefix="/api/export", tags=["export"])

@router.post("/pdf")
async def export_pdf(req: ExportRequest):
    try:
        path = "/tmp/resume.pdf"
        export_resume_to_pdf(req.profile.model_dump(), req.analysis.model_dump(), path)
        return FileResponse(path, media_type="application/pdf", filename="resume.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/docx")
async def export_docx(req: ExportRequest):
    try:
        path = "/tmp/resume.docx"
        export_resume_to_docx(req.profile.model_dump(), req.analysis.model_dump(), path)
        return FileResponse(path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename="resume.docx")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'@ | Set-Content -Path "$root\backend\app\routers\export.py" -Encoding UTF8

# ----------- backend/app/main.py integration ----------- 
@'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers.analysis import router as analysis_router
from app.routers.profile import router as profile_router
from app.routers.export import router as export_router

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

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "CareerFit AI backend is running"}
'@ | Set-Content -Path "$root\backend\app\main.py" -Encoding UTF8

# ----------- frontend/package.json ----------- 
@'
{
  "name": "careerfit-ai-frontend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.7.2",
    "lucide-react": "^0.453.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.3"
  }
}
'@ | Set-Content -Path "$root\frontend\package.json" -Encoding UTF8

# ----------- frontend/tsconfig.json ----------- 
@'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
'@ | Set-Content -Path "$root\frontend\tsconfig.json" -Encoding UTF8

# ----------- frontend/next-env.d.ts ----------- 
@'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited.
'@ | Set-Content -Path "$root\frontend\next-env.d.ts" -Encoding UTF8

# ----------- frontend/next.config.js ----------- 
@'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
'@ | Set-Content -Path "$root\frontend\next.config.js" -Encoding UTF8

# ----------- frontend/postcss.config.js ----------- 
@'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@ | Set-Content -Path "$root\frontend\postcss.config.js" -Encoding UTF8

# ----------- frontend/tailwind.config.js ----------- 
@'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d7ecff",
          200: "#b4ddff",
          300: "#82c5ff",
          400: "#4da6ff",
          500: "#1e7af7",
          600: "#135ad0",
          700: "#104aa8",
          800: "#123f8b",
          900: "#153972",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }
    },
  },
  plugins: [],
};
'@ | Set-Content -Path "$root\frontend\tailwind.config.js" -Encoding UTF8

# ----------- frontend/app/globals.css ----------- 
@'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 15, 23, 42;
  --background-rgb: 248, 250, 252;
}

html {
  scroll-behavior: smooth;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

::selection {
  background: rgba(30, 122, 247, 0.2);
}
'@ | Set-Content -Path "$root\frontend\app\globals.css" -Encoding UTF8

# ----------- frontend/app/layout.tsx ----------- 
@'
import "./globals.css";

export const metadata = {
  title: "CareerFit AI",
  description: "AI-powered resume tailoring and career fit platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
'@ | Set-Content -Path "$root\frontend\app\layout.tsx" -Encoding UTF8

# ----------- frontend/app/page.tsx ----------- 
@'
import LandingPage from "@/components/LandingPage";

export default function HomePage() {
  return <LandingPage />;
}
'@ | Set-Content -Path "$root\frontend\app\page.tsx" -Encoding UTF8

# ----------- frontend/app/dashboard/page.tsx ----------- 
@'
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Career Dashboard</h1>
            <p className="text-slate-600">Your profile intelligence, match score, and next recommended actions.</p>
          </div>
          <Link href="/analyze" className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white">
            Analyze new JD
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Match Score</div>
            <div className="mt-4 text-4xl font-black text-brand-600">87%</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Strong Skills</div>
            <div className="mt-4 text-lg font-bold text-slate-900">Python, SQL, React</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Recommended Roles</div>
            <div className="mt-4 text-lg font-bold text-slate-900">AI Engineer, Backend Engineer</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-bold text-slate-900">Skill roadmap</h3>
            <div className="mt-4 space-y-3">
              {["LLM", "RAG", "Prompt Engineering", "MLOps"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{item}</div>
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700">High priority</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-bold text-slate-900">Suggested jobs for you</h3>
            <div className="mt-4 space-y-3">
              {[
                { role: "AI Engineer", score: 89 },
                { role: "Senior Product Engineer", score: 85 },
                { role: "Backend Engineer", score: 82 }
              ].map((job) => (
                <div key={job.role} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{job.role}</div>
                  <span className="text-sm font-semibold text-brand-600">{job.score}% fit</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$root\frontend\app\dashboard\page.tsx" -Encoding UTF8

# ----------- frontend/app/builder/page.tsx ----------- 
@'
import ResumeBuilder from "@/components/ResumeBuilder";

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <ResumeBuilder />
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$root\frontend\app\builder\page.tsx" -Encoding UTF8

# ----------- frontend/app/analyze/page.tsx -----------
@'
"use client";

import { useState } from "react";
import JDAnalyzer from "@/components/JDAnalyzer";
import SkillGapPanel from "@/components/SkillGapPanel";

export default function AnalyzePage() {
  const [analysis, setAnalysis] = useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900">Analyze your fit</h1>
          <p className="mt-2 text-slate-600">Paste a job description and see your alignment, keyword gaps, and roadmap.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <JDAnalyzer onResult={setAnalysis} />
          <SkillGapPanel data={analysis} />
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\frontend\app\analyze\page.tsx" -Encoding UTF8

# ----------- frontend/lib/types.ts ----------- 
@'
export type SkillGap = {
  skill: string;
  importance: string;
  reason: string;
  recommended_learning_path: string;
};

export type StrongSkill = {
  skill: string;
  match_strength: string;
};

export type AnalysisResponse = {
  match_score: number;
  summary: string;
  strong_skills: StrongSkill[];
  missing_skills: SkillGap[];
  keyword_gap: string[];
  description_fit: string;
  skill_roadmap: Array<{
    skill: string;
    priority: string;
    timeline: string;
    reason: string;
  }>;
  job_recommendations: Array<{
    role: string;
    fit_score: number;
    reasons: string[];
  }>;
  suggestions: Array<{
    section: string;
    content: string;
    score_delta: number;
  }>;
  resume_summary_rewrite: string;
};
'@ | Set-Content -Path "$root\frontend\lib\types.ts" -Encoding UTF8

# ----------- frontend/lib/api.ts ----------- 
@'
import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export const analyzeProfile = async (payload: any) => {
  const res = await API.post("/api/analysis/analyze", payload);
  return res.data;
};

export const saveProfile = async (payload: any) => {
  const res = await API.post("/api/profile/save", payload);
  return res.data;
};

export const exportPdf = async (payload: any) => {
  const res = await API.post("/api/export/pdf", payload, {
    responseType: "blob",
  });
  return res;
};

export const exportDocx = async (payload: any) => {
  const res = await API.post("/api/export/docx", payload, {
    responseType: "blob",
  });
  return res;
};
'@ | Set-Content -Path "$root\frontend\lib\api.ts" -Encoding UTF8

# ----------- frontend/components/LandingPage.tsx ----------- 
@'
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold">C</div>
            <div>
              <div className="text-lg font-semibold">CareerFit AI</div>
              <div className="text-xs text-slate-400">Job fit + resume optimization</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-300">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <Link href="/dashboard" className="rounded-full bg-brand-500 px-4 py-2 font-medium text-white">
              Try Demo
            </Link>
          </div>
        </nav>

        <section className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
              AI-powered tailored resumes for the right jobs
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight">
              Tailor your resume to the exact job. <span className="text-brand-400">Before you apply.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Analyze your profile, compare with the job description, reveal missing skills, rewrite bullets,
              optimize ATS fit, and export a clean resume in PDF or DOCX.
            </p>

            <div className="mt-8 flex gap-4">
              <Link href="/analyze" className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-500/20">
                Start analyzing
              </Link>
              <Link href="/builder" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-semibold text-slate-100">
                Open editor
              </Link>
            </div>

            <div className="mt-10 flex gap-10 text-sm text-slate-400">
              <div><span className="text-2xl font-bold text-white">94%</span><br/>ATS compatibility</div>
              <div><span className="text-2xl font-bold text-white">8x</span><br/>faster tailoring</div>
              <div><span className="text-2xl font-bold text-white">1-click</span><br/>PDF + DOCX export</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-soft">
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-300">JD Match Score</div>
                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">87%</div>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-brand-500"></div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Strong skills</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">Python</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">SQL</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">React</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">AI</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Missing Keywords</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">LLM</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">RAG</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">Prompt Engineering</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Suggested improvement</div>
                  <div className="mt-2 text-sm text-slate-200">
                    Add measurable impact and AI-focused technical ownership to your achievements.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
'@ | Set-Content -Path "$root\frontend\components\LandingPage.tsx" -Encoding UTF8

# ----------- frontend/components/JDAnalyzer.tsx -----------
@'
"use client";

import { useState } from "react";
import { analyzeProfile } from "@/lib/api";

export default function JDAnalyzer({ onResult }: { onResult: (data: any | null) => void }) {
  const [jdText, setJdText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      setError("Paste a job description before analyzing.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");

    const payload = {
      profile: {
        name: "Ananya Sharma",
        current_title: "Software Engineer",
        years_experience: 4,
        summary: "Software engineer with experience in Python, React, and AI-powered platform work.",
        skills: ["python", "sql", "javascript", "react", "ai", "machine learning"],
        experience: [
          {
            company: "OpenAI Partner Labs",
            role: "Software Engineer",
            duration: "2022 - Present",
            bullets: [
              "Built workflow automation systems reducing manual effort by 40%",
              "Developed internal platform features used by 100+ users",
              "Worked with AI-powered product flows and robust backend APIs"
            ]
          }
        ],
        projects: [
          {
            name: "CareerFit AI",
            description: "Built a resume optimization platform using AI and ATS matching logic.",
            tech_stack: ["React", "Python", "FastAPI", "OpenAI"],
            impact: "Increased resume fit quality for target jobs"
          }
        ]
      },
      jd: {
        raw_text: jdText,
        title: "AI Engineer"
      }
    };

    try {
      const data = await analyzeProfile(payload);
      setResult(data);
      onResult(data);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Analysis failed. Check that the backend is running and try again.");
      setResult(null);
      onResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">JD Analyzer</h2>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isLoading ? "Analyzing..." : "Analyze JD"}
        </button>
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800 outline-none"
        placeholder="Paste job description here..."
      />

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">JD Match Score</div>
            <div className="text-2xl font-black text-brand-600">{result.match_score}%</div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-700">Strong skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.strong_skills?.map((skill: any) => (
                <span key={skill.skill} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                  {skill.skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-700">Missing keywords</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.missing_skills?.map((skill: any) => (
                <span key={skill.skill} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                  {skill.skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\frontend\components\JDAnalyzer.tsx" -Encoding UTF8

# ----------- frontend/components/SkillGapPanel.tsx ----------- 
@'
"use client";

export default function SkillGapPanel({ data }: { data?: any }) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-xl font-bold text-slate-900">Skill gap + roadmap</h3>

      <div className="mt-6 space-y-5">
        {data.missing_skills?.map((skill: any) => (
          <div key={skill.skill} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-slate-800">{skill.skill}</div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">{skill.importance}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{skill.reason}</p>
            <p className="mt-2 text-xs text-slate-500">Recommended path: {skill.recommended_learning_path}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold text-slate-700">Learning roadmap</div>
        <div className="mt-3 space-y-3">
          {data.skill_roadmap?.map((item: any) => (
            <div key={item.skill} className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
              <div>
                <div className="font-medium text-slate-800">{item.skill}</div>
                <div className="text-xs text-slate-500">{item.reason}</div>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700">{item.timeline}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$root\frontend\components\SkillGapPanel.tsx" -Encoding UTF8

# ----------- frontend/components/ResumeBuilder.tsx ----------- 
@'
"use client";

import { useState } from "react";

const initialResume = {
  summary: "Product-minded software engineer specializing in AI workflows, platform development, and measurable business outcomes.",
  experience: [
    {
      company: "Tech Nova",
      role: "Software Engineer",
      bullets: [
        "Built feature-rich web products with strong product thinking and fast iteration cycles.",
        "Collaborated with cross-functional teams to deliver scalable user-facing experiences.",
        "Reduced manual workflows and improved release reliability."
      ]
    }
  ],
  skills: ["Python", "React", "SQL", "AI", "System Design", "Product Strategy"]
};

export default function ResumeBuilder() {
  const [resume, setResume] = useState(initialResume);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-xl font-bold text-slate-900">Resume editor</h3>

        <div className="mt-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Summary</label>
            <textarea
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-200 p-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Skills</label>
            <input
              value={resume.skills.join(", ")}
              onChange={(e) => setResume({ ...resume, skills: e.target.value.split(",").map(s => s.trim()) })}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Live Preview</h3>
          <button className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Export</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h1 className="text-3xl font-black text-slate-900">Jane Smith</h1>
          <p className="mt-2 text-sm text-slate-600">Senior Product Engineer</p>

          <div className="mt-6">
            <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Summary</div>
            <p className="mt-2 text-sm text-slate-700">{resume.summary}</p>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">{skill}</span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold uppercase tracking-wide text-slate-500">Experience</div>
            {resume.experience.map((exp, idx) => (
              <div key={`${exp.company}-${idx}`} className="mt-4">
                <div className="font-semibold text-slate-800">{exp.role}</div>
                <div className="text-sm text-slate-600">{exp.company}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {exp.bullets.map((bullet, i) => (
                    <li key={`${bullet}-${i}`}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$root\frontend\components\ResumeBuilder.tsx" -Encoding UTF8

# ----------- frontend/components/MatchOverview.tsx ----------- 
@'
"use client";

export default function MatchOverview({ data }: { data?: any }) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Match Overview</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          {data.match_score}% fit
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 text-sm text-slate-600">JD alignment</div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${data.match_score}%` }} />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">Summary</div>
          <p className="mt-2 text-sm text-slate-600">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "$root\frontend\components\MatchOverview.tsx" -Encoding UTF8

# ----------- docker-compose.yml ----------- 
@'
version: "3.9"

services:
  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=development
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    command: npm run dev
'@ | Set-Content -Path "$root\docker-compose.yml" -Encoding UTF8

# ----------- .gitignore ----------- 
@'
# Node
frontend/node_modules
frontend/.next
frontend/out

# Python
backend/venv
backend/__pycache__
backend/**/*.pyc
backend/.env

# OS
.DS_Store
Thumbs.db
'@ | Set-Content -Path "$root\.gitignore" -Encoding UTF8

# ----------- frontend/.gitignore ----------- 
@'
node_modules
.next
out
'@ | Set-Content -Path "$root\frontend\.gitignore" -Encoding UTF8

# ----------- root .env.example -----------
@'
NEXT_PUBLIC_API_URL=http://localhost:8000
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\.env.example" -Encoding UTF8

# ----------- README.md -----------
@'
# CareerFit AI

CareerFit AI is an AI-powered career intelligence and resume optimization platform designed for job seekers who want to:
- tailor resumes to a specific job description
- discover skill gaps and missing keywords
- improve ATS compatibility
- receive AI-guided bullet and summary improvements
- edit resumes in a live visual editor
- export documents as PDF and DOCX
- identify suitable roles and future skills needed for career growth

This project is built for hackathons and real-world use cases, combining:
- AI analysis
- job-fit matching
- resume tailoring
- visual editing
- export engine
- skill roadmap generation

---

## Problem Statement

Job seekers spend hours rewriting resumes for different job descriptions. Most resume tools are limited to templates or basic keyword checking. They do not deeply analyze:
- candidate profile vs JD alignment
- keyword gaps
- missing technical skills
- bullet-level optimization
- future skill roadmap
- suitable role recommendations
- live resume editing and export

CareerFit AI solves this by acting as an AI resume architect and career fit coach.

---

## Core Features

1. Profile-Based Resume Input
- personal details
- years of experience
- skills
- work experience
- projects
- education
- certifications

2. JD Analysis
- paste job description text
- or provide a job URL
- extract required technical skills and keywords
- compare against user profile

3. JD Match Score
- percentage-based fit score
- role matching logic
- explainable strengths and weaknesses

4. Missing Skills & Keyword Analysis
- identify missing keywords
- highlight missing technical skills
- explain why those skills matter

5. AI Resume Recommendations
- rewrite professional summary
- recommend stronger bullets
- highlight content improvements
- suggest achievements with measurable impact

6. Responsive Visual Resume Editor
- live resume preview
- editable summary and skills
- section adjustments
- modern ATS-friendly design

7. Role & Skill Roadmap
- suggest job roles matching the user profile
- highlight skills to learn next
- provide AI-era skill recommendations

8. Export to PDF and DOCX
- export to clean PDF document
- export to DOCX / Word document
- preserve structured formatting

---

## Innovation Gap

This project goes beyond a plain resume builder by combining:
- AI-powered JD matching
- job-fit recommendation
- missing skill identification
- AI-era skill roadmap
- professional resume editing
- PDF/DOCX export

This makes it more valuable than common resume tools like:
- simple resume templates
- basic keyword scanners
- static resume generators

It becomes a real career optimization system.

---

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- React
- Axios

### Backend
- Python
- FastAPI
- Pydantic
- OpenAI API
- python-docx
- reportlab

### Additional Tools
- dotenv
- BeautifulSoup
- VS Code
- Git / GitHub

---

## Project Structure

```text
careerfit-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── schemas.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── analysis_service.py
│   │   │   ├── export_service.py
│   │   │   └── recommendation_service.py
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── analysis.py
│   │       ├── export.py
│   │       └── profile.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── venv
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── builder/
│   │   │   └── page.tsx
│   │   └── analyze/
│   │       └── page.tsx
│   ├── components/
│   │   ├── LandingPage.tsx
│   │   ├── JDAnalyzer.tsx
│   │   ├── SkillGapPanel.tsx
│   │   ├── ResumeBuilder.tsx
│   │   └── MatchOverview.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── types.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── next-env.d.ts
│   └── .gitignore
├── README.md
├── docker-compose.yml
├── .gitignore
├── .env.example
└── .venv
```

---

## Running the Project Locally

### 1. Backend Setup

Open a terminal in the project root and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.
API documentation: `http://localhost:8000/docs`.

### 2. Frontend Setup

Open a second terminal in the project root and run:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Environment Variables

The backend reads its Featherless API settings from `backend/.env`:

```env
FEATHERLESS_API_KEY=your_featherless_api_key_here
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1
FEATHERLESS_MODEL=Qwen/Qwen2.5-7B-Instruct
APP_ENV=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Replace the placeholder with your own API key. Do not commit `.env` files or expose API keys in frontend code or GitHub.

---

## Notes

- Create the Python virtual environment by running the backend setup commands above; it is not source code and does not need to be copied manually.
- Install Node.js and Python before starting the frontend and backend.
- Keep the backend and frontend running in separate terminals during local development.
'@ | Set-Content -Path "D:\Hacktoberfest\careerfit-ai\README.md" -Encoding UTF8