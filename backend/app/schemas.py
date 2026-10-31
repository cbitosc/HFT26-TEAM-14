from typing import List, Optional, Literal
from pydantic import BaseModel, Field

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
    career_stage: Literal["student", "final_year", "fresher", "early_career", "experienced"] = "fresher"
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

class JobDiscoveryRequest(BaseModel):
    profile: ProfileInput
    location: str
    country_code: str
    max_results: Literal[10, 20] = 10
    work_mode: Literal["any", "remote", "hybrid", "onsite"] = "any"

class JobSourceLink(BaseModel):
    label: str
    url: str

class DiscoveredJob(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str = ""
    posted_at: Optional[str] = None
    salary: Optional[str] = None
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    match_score: int
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    match_reasons: List[str] = []
    source: str
    source_links: List[JobSourceLink] = []

class JobDiscoveryResponse(BaseModel):
    jobs: List[DiscoveredJob] = []
    total_found: int = 0
    location: str
    country_code: str
    search_queries: List[str] = []
    sources_searched: List[str] = []
    warnings: List[str] = []

class PreparationRequest(BaseModel):
    profile: ProfileInput
    country_code: str
    target_role: Optional[str] = ""
    weekly_hours: int = Field(default=6, ge=1, le=40)

class PreparationSkill(BaseModel):
    skill: str
    market_demand_count: int
    market_demand_percent: int
    priority_score: int
    priority: str
    difficulty: str
    estimated_hours: int
    reason: str
    learning_path: List[str] = []
    portfolio_task: str = ""

class PreparationPlanItem(BaseModel):
    week: int
    title: str
    focus: str
    deliverable: str

class PreparationResponse(BaseModel):
    target_role: str
    career_stage: str
    readiness_score: int
    readiness_label: str
    market_sample_count: int
    market_scope: str
    sources: List[str] = []
    market_skills: List[PreparationSkill] = []
    profile_strengths: List[str] = []
    skills_to_build: List[PreparationSkill] = []
    plan_weeks: int
    weekly_hours: int
    plan: List[PreparationPlanItem] = []
    resume_actions: List[str] = []
    warnings: List[str] = []
