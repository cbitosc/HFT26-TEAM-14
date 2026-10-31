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
    "user research", "prioritization", "experimentation", "backend", "git", "linux", "ci/cd", "testing",
    "unit testing", "agile", "communication", "problem solving", "teamwork", "project management", "excel",
    "technical writing", "leadership", "security", "data structures", "algorithms", "oop", "cloud computing",
    "devops", "html", "figma", "product management", "product analytics", "business analysis", "customer service",
    "salesforce", "data engineering", "data visualization", "monitoring", "observability", "quality assurance"
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
