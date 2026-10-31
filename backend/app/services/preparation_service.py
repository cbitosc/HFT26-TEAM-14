import asyncio
import math
import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Set, Tuple

import httpx

from app.config import ADZUNA_APP_ID, ADZUNA_APP_KEY, SERPAPI_API_KEY
from app.schemas import (
    JobDiscoveryRequest,
    PreparationPlanItem,
    PreparationRequest,
    PreparationResponse,
    PreparationSkill,
)
from app.services.analysis_service import (
    ROLE_SKILL_LIBRARY,
    extract_jd_skills,
    extract_skills_from_profile,
    normalize_skill,
)
from app.services.job_discovery_service import (
    ADZUNA_COUNTRIES,
    JOBICY_GEO_BY_COUNTRY,
    _normalize_adzuna,
    _normalize_google_job,
    _normalize_jobicy,
)

STAGE_URGENCY = {
    "student": 0.75,
    "final_year": 1.35,
    "fresher": 0.88,
    "early_career": 1.08,
    "experienced": 1.0,
}
STAGE_LABEL = {
    "student": "Student · foundation-building",
    "final_year": "Final-year student · accelerated preparation",
    "fresher": "Fresher / recent graduate · entry-level preparation",
    "early_career": "Early-career professional · focused upskilling",
    "experienced": "Experienced professional · targeted upskilling",
}
ADVANCED_SKILLS = {
    "agentic ai", "deep learning", "kubernetes", "llm", "machine learning", "mlops",
    "pytorch", "rag", "system design", "tensorflow", "vector databases",
}
FOUNDATION_SKILLS = {
    "api", "css", "data analysis", "javascript", "python", "react", "sql", "statistics",
}
PREREQUISITES = {
    "machine learning": {"python", "statistics"},
    "deep learning": {"python", "machine learning"},
    "pytorch": {"python", "machine learning"},
    "tensorflow": {"python", "machine learning"},
    "rag": {"python", "llm", "api"},
    "vector databases": {"sql", "python", "rag"},
    "kubernetes": {"docker", "cloud", "aws", "azure", "gcp"},
    "system design": {"api", "backend", "microservices"},
    "typescript": {"javascript"},
    "react": {"javascript", "html", "css"},
    "nextjs": {"react", "typescript"},
    "node": {"javascript"},
    "docker": {"linux"},
    "aws": {"cloud computing", "linux"},
    "azure": {"cloud computing", "linux"},
    "gcp": {"cloud computing", "linux"},
    "data analysis": {"python", "sql", "excel"},
    "data engineering": {"python", "sql", "spark"},
    "pandas": {"python"},
    "scikit-learn": {"python", "statistics"},
    "prompt engineering": {"llm"},
    "agentic ai": {"python", "llm", "api"},
}


def _infer_target_role(request: PreparationRequest) -> str:
    if request.target_role and request.target_role.strip():
        return request.target_role.strip()
    if request.profile.current_title and request.profile.current_title.strip():
        return request.profile.current_title.strip()
    skills = set(extract_skills_from_profile(request.profile.model_dump()))
    ranked = []
    for role, role_skills in ROLE_SKILL_LIBRARY.items():
        required = {normalize_skill(skill) for skill in role_skills}
        ranked.append((len(skills & required) / max(len(required), 1), role))
    ranked.sort(reverse=True)
    if ranked and ranked[0][0] > 0:
        return ranked[0][1].replace("_", " ").title()
    return "Software Engineer"


def _role_skills(target_role: str) -> Set[str]:
    target = normalize_skill(target_role)
    target_words = set(re.findall(r"[a-z0-9]+", target))
    best_role = None
    best_score = 0.0
    for role in ROLE_SKILL_LIBRARY:
        label = role.replace("_", " ")
        role_words = set(label.split())
        similarity = SequenceMatcher(None, target, label).ratio()
        word_score = len(target_words & role_words) / max(len(target_words), 1)
        score = max(similarity, word_score)
        if score > best_score:
            best_score, best_role = score, role
    if best_role and best_score >= 0.34:
        return {normalize_skill(skill) for skill in ROLE_SKILL_LIBRARY[best_role]}
    return set()


async def _fetch_current_market(request: PreparationRequest, target_role: str) -> Tuple[List[Dict[str, Any]], List[str], List[str]]:
    country_code = request.country_code.lower()
    if not re.fullmatch(r"[a-z]{2}", country_code):
        raise ValueError("Choose a valid two-letter country code for market research.")

    discovery_request = JobDiscoveryRequest(
        profile=request.profile,
        location=request.profile.location or "",
        country_code=country_code,
        max_results=20,
        work_mode="remote",
    )
    warnings: List[str] = []
    sources: List[str] = []
    jobs: List[Dict[str, Any]] = []
    query = target_role

    async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=5.0), follow_redirects=True) as client:
        tasks = []
        if country_code in JOBICY_GEO_BY_COUNTRY:
            params: Dict[str, Any] = {"count": 100, "geo": JOBICY_GEO_BY_COUNTRY[country_code], "tag": query}
            tasks.append(("Jobicy", client.get("https://jobicy.com/api/jobs", params=params)))
        else:
            warnings.append("Jobicy has no matching regional filter for this country; checking its worldwide remote feed.")
            tasks.append(("Jobicy", client.get("https://jobicy.com/api/jobs", params={"count": 100, "tag": query})))
        if ADZUNA_APP_ID and ADZUNA_APP_KEY and country_code in ADZUNA_COUNTRIES:
            params = {
                "app_id": ADZUNA_APP_ID,
                "app_key": ADZUNA_APP_KEY,
                "results_per_page": 20,
                "what": query,
                "where": request.profile.location or "",
                "content-type": "application/json",
                "sort_by": "date",
            }
            url = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/1"
            tasks.append(("Adzuna", client.get(url, params=params)))
        if SERPAPI_API_KEY:
            params = {
                "engine": "google_jobs",
                "q": query,
                "location": request.profile.location or country_code,
                "gl": country_code,
                "hl": "en",
                "api_key": SERPAPI_API_KEY,
            }
            tasks.append(("Google Jobs via SerpApi", client.get("https://serpapi.com/search.json", params=params)))

        outcomes = await asyncio.gather(*(task[1] for task in tasks), return_exceptions=True)
        for (source, _), outcome in zip(tasks, outcomes):
            if isinstance(outcome, Exception):
                warnings.append(f"{source} did not respond: {type(outcome).__name__}.")
                continue
            try:
                outcome.raise_for_status()
                data = outcome.json()
                if source == "Jobicy":
                    if data.get("success") is False:
                        raise RuntimeError(data.get("error") or "Jobicy response was unsuccessful")
                    jobs.extend(_normalize_jobicy(item) for item in data.get("jobs", []))
                elif source == "Adzuna":
                    jobs.extend(_normalize_adzuna(item, country_code) for item in data.get("results", []))
                else:
                    if data.get("error"):
                        raise RuntimeError(str(data["error"]))
                    jobs.extend(_normalize_google_job(item) for item in data.get("jobs_results", []))
                sources.append(source)
            except Exception as exc:
                warnings.append(f"{source} market data could not be read: {type(exc).__name__}.")

        # Jobicy's title tag is narrow. A no-tag regional sample is used only
        # when the role-targeted query produced fewer than ten current listings.
        if len(jobs) < 10 and "Jobicy" in sources:
            warnings.append("The role-specific feed was small, so the sample was broadened to recent remote listings for the same region.")
            geo = JOBICY_GEO_BY_COUNTRY.get(country_code)
            params = {"count": 100}
            if geo:
                params["geo"] = geo
            try:
                response = await client.get("https://jobicy.com/api/jobs", params=params)
                response.raise_for_status()
                data = response.json()
                jobs.extend(_normalize_jobicy(item) for item in data.get("jobs", []))
            except Exception as exc:
                warnings.append(f"Jobicy's broader regional sample failed: {type(exc).__name__}.")

    unique: Dict[str, Dict[str, Any]] = {}
    for job in jobs:
        key = "|".join(normalize_skill(str(job.get(part, ""))) for part in ("title", "company", "location"))
        unique.setdefault(key, job)
    return list(unique.values()), sorted(set(sources)), warnings


def _difficulty(skill: str, profile_skills: Set[str]) -> Tuple[str, int, str]:
    prerequisites = PREREQUISITES.get(skill, set())
    adjacent = bool(prerequisites & profile_skills)
    if skill in FOUNDATION_SKILLS:
        level, hours = "Foundation", 12
    elif skill in ADVANCED_SKILLS:
        level, hours = ("Moderate", 24) if adjacent else ("Advanced", 38)
    else:
        level, hours = ("Foundation", 14) if adjacent else ("Moderate", 22)
    if adjacent:
        hours = max(6, round(hours * 0.72))
        if level == "Advanced":
            level = "Moderate"
    return level, hours, "Build on your existing " + ", ".join(sorted(prerequisites & profile_skills)) if adjacent else "Start with the fundamentals, then apply them in a small portfolio project."


def _portfolio_task(skill: str, target_role: str) -> str:
    examples = {
        "sql": "Build a small dataset report with joins, aggregations, and a short insight summary.",
        "python": "Create a tested command-line or API project that solves one concrete problem.",
        "react": "Build and deploy an accessible, responsive interface that consumes an API.",
        "machine learning": "Train and evaluate a baseline model, document metrics, and explain its limitations.",
        "llm": "Build a small role-specific assistant and document evaluation cases and failure handling.",
        "rag": "Build a retrieval demo with cited answers and a small evaluation set.",
        "docker": "Containerize your role-focused project and document the local run steps.",
        "system design": "Write and diagram a scalable design for a small product feature, including trade-offs.",
    }
    return examples.get(skill, f"Create a small {target_role} portfolio project that demonstrates {skill} with a README and measurable outcome.")


def build_preparation_response(
    request: PreparationRequest,
    target_role: str,
    jobs: List[Dict[str, Any]],
    sources: List[str],
    warnings: List[str],
) -> PreparationResponse:
    profile = request.profile.model_dump()
    profile_skills = set(extract_skills_from_profile(profile))
    target_skills = _role_skills(target_role)
    frequency: Dict[str, int] = {}
    for job in jobs:
        text = f"{job.get('title', '')} {job.get('description', '')}"
        for skill in set(extract_jd_skills(text)):
            frequency[skill] = frequency.get(skill, 0) + 1

    matching_market_skills = [skill for skill in frequency if not target_skills or skill in target_skills]
    if not matching_market_skills:
        if frequency:
            matching_market_skills = list(frequency)
            warnings.append("The selected role had few recognized skill mentions, so skill-demand counts use the broader selected-market sample.")
        elif target_skills:
            matching_market_skills = sorted(target_skills)
            warnings.append("Live listings did not provide recognized skill mentions; these fallback skills come from the app's role baseline, not live demand.")
    sample_count = len(jobs)
    max_count = max((frequency.get(skill, 0) for skill in matching_market_skills), default=1)
    stage = profile.get("career_stage", "fresher")
    urgency = STAGE_URGENCY.get(stage, 1.0)

    def make_skill(skill: str, gap: bool) -> PreparationSkill:
        count = frequency.get(skill, 0)
        percent = round((count / sample_count) * 100) if sample_count else 0
        difficulty, hours, prerequisite_note = _difficulty(skill, profile_skills)
        demand_score = count / max_count if max_count else 0
        priority_score = round(min(100, 55 * demand_score + (30 if gap else 8) + 15 * urgency))
        priority = "High" if priority_score >= 78 else "Medium" if priority_score >= 58 else "Build over time"
        reason = f"Mentioned in {count} of {sample_count} current listings in this sample ({percent}%). " if sample_count else "No live market sample was available. "
        if gap:
            reason += f"It is not evident in your profile. {prerequisite_note}"
        else:
            reason += "Your profile already contains this skill; add stronger proof or depth instead of relearning it."
        learning_path = [
            f"Learn core {skill} concepts and terminology.",
            f"Practice {skill} on a small task related to {target_role}.",
            "Publish the project, document your decisions, and add only verified evidence to your resume.",
        ]
        return PreparationSkill(
            skill=skill,
            market_demand_count=count,
            market_demand_percent=percent,
            priority_score=priority_score,
            priority=priority,
            difficulty=difficulty,
            estimated_hours=hours,
            reason=reason,
            learning_path=learning_path,
            portfolio_task=_portfolio_task(skill, target_role),
        )

    market_skills = [make_skill(skill, skill not in profile_skills) for skill in matching_market_skills]
    market_skills.sort(key=lambda item: (item.market_demand_count, item.priority_score), reverse=True)
    missing = [item for item in market_skills if item.skill not in profile_skills]
    missing.sort(key=lambda item: (item.priority_score, item.market_demand_count), reverse=True)
    selected_missing = missing[:6]

    readiness_skills = target_skills or {item.skill for item in market_skills[:8]}
    skill_coverage = len(readiness_skills & profile_skills) / max(len(readiness_skills), 1)
    evidence = min(1.0, (len(profile.get("experience", [])) * 0.65 + len(profile.get("projects", [])) * 0.45))
    readiness = round(100 * (0.78 * skill_coverage + 0.22 * evidence))
    readiness_label = "Strong resume evidence" if readiness >= 70 else "Developing evidence" if readiness >= 40 else "Foundation-building stage"

    weekly_hours = request.weekly_hours
    plan_focus = selected_missing[:3]
    total_hours = sum(skill.estimated_hours for skill in plan_focus)
    plan_weeks = max(4, math.ceil(total_hours / weekly_hours)) if plan_focus else 4
    if plan_weeks > 24:
        plan_weeks = 24
        warnings.append("The plan is capped at 24 weeks. Prioritize the first three skills, then regenerate the plan for the next skills.")
    plan: List[PreparationPlanItem] = []
    for week in range(1, plan_weeks + 1):
        if plan_focus:
            elapsed_hours = (week - 1) * weekly_hours
            accumulated = 0
            skill = plan_focus[-1]
            for candidate in plan_focus:
                accumulated += candidate.estimated_hours
                if elapsed_hours < accumulated:
                    skill = candidate
                    break
            focus = f"{skill.skill} · {skill.difficulty.lower()} level"
            deliverable = skill.portfolio_task if week == 1 or week % 2 == 0 else f"Practice {skill.skill} and record one concrete result or lesson learned."
            title = f"Week {week}: {skill.skill}"
        else:
            focus = f"Strengthen evidence for {target_role}"
            deliverable = "Build or improve a role-relevant portfolio artifact and quantify its outcome."
            title = f"Week {week}: portfolio proof"
        plan.append(PreparationPlanItem(week=week, title=title, focus=focus, deliverable=deliverable))

    if len(jobs) == 0:
        warnings.append("No current postings were available from the configured sources. The page will still show profile-based role guidance, but it cannot claim live-market demand.")
    elif len(jobs) < 10:
        warnings.append("The live market sample is small; demand percentages are directional, not a labor-market census.")
    warnings.append("This is a resume and learning-priority estimate from currently available listings, not a hiring guarantee. List skills on your resume only when you can support them with real work.")

    return PreparationResponse(
        target_role=target_role,
        career_stage=STAGE_LABEL.get(stage, STAGE_LABEL["fresher"]),
        readiness_score=readiness,
        readiness_label=readiness_label,
        market_sample_count=sample_count,
        market_scope="Recent live role listings; coverage varies by source" if jobs else "Live market data unavailable",
        sources=sources,
        market_skills=market_skills[:8],
        profile_strengths=[skill for skill in (item.skill for item in market_skills) if skill in profile_skills][:8],
        skills_to_build=selected_missing,
        plan_weeks=plan_weeks,
        weekly_hours=weekly_hours,
        plan=plan,
        resume_actions=[
            f"Aim the resume headline and summary at {target_role}, using only skills you can demonstrate.",
            "Turn your best relevant project or internship into bullets that show the problem, your action, and the result.",
            "After completing a learning project, add its tools and measured outcome to Projects; do not list planned skills as mastered.",
        ],
        warnings=warnings,
    )


async def prepare_for_job(request: PreparationRequest) -> PreparationResponse:
    if not request.profile.skills and not request.profile.current_title and not request.profile.summary and not request.profile.projects:
        raise ValueError("Add your title, skills, summary, or projects to Profile before building a preparation plan.")
    target_role = _infer_target_role(request)
    jobs, sources, warnings = await _fetch_current_market(request, target_role)
    return build_preparation_response(request, target_role, jobs, sources, warnings)
