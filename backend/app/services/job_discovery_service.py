import asyncio
import html
import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Tuple

import httpx

from app.config import ADZUNA_APP_ID, ADZUNA_APP_KEY, SERPAPI_API_KEY
from app.schemas import DiscoveredJob, JobDiscoveryRequest, JobSourceLink
from app.services.analysis_service import ROLE_SKILL_LIBRARY, extract_jd_skills, extract_skills_from_profile, normalize_skill

ADZUNA_COUNTRIES = {
    "at", "au", "be", "br", "ca", "de", "fr", "in", "it", "mx", "nl", "nz", "pl", "sg", "za", "es", "gb", "us"
}
CURRENCY_BY_COUNTRY = {
    "at": "EUR", "au": "AUD", "be": "EUR", "br": "BRL", "ca": "CAD", "de": "EUR", "es": "EUR",
    "fr": "EUR", "gb": "GBP", "in": "INR", "it": "EUR", "mx": "MXN", "nl": "EUR", "nz": "NZD",
    "pl": "PLN", "sg": "SGD", "us": "USD", "za": "ZAR"
}
JOBICY_GEO_BY_COUNTRY = {
    "at": "europe", "au": "australia", "be": "belgium", "br": "brazil", "ca": "canada",
    "de": "germany", "es": "spain", "fr": "france", "gb": "uk", "in": "apac",
    "it": "italy", "mx": "mexico", "nl": "netherlands", "nz": "new-zealand", "pl": "poland",
    "sg": "singapore", "us": "usa", "za": "apac",
}


def _query_for_mode(query: str, work_mode: str) -> str:
    suffix = {"remote": " remote", "hybrid": " hybrid", "onsite": " on-site"}.get(work_mode, "")
    return f"{query}{suffix}"


def _search_queries(request: JobDiscoveryRequest) -> List[str]:
    profile = request.profile.model_dump()
    queries: List[str] = []
    if profile.get("current_title", "").strip():
        queries.append(profile["current_title"].strip())

    skills = set(extract_skills_from_profile(profile))
    ranked_roles = []
    for role, role_skills in ROLE_SKILL_LIBRARY.items():
        required = {normalize_skill(skill) for skill in role_skills}
        score = len(skills & required) / max(len(required), 1)
        if score >= 0.20:
            ranked_roles.append((score, role.replace("_", " ").title()))
    ranked_roles.sort(reverse=True)
    for _, role in ranked_roles:
        if not any(normalize_skill(role) == normalize_skill(existing) for existing in queries):
            queries.append(role)
        if len(queries) >= 3:
            break

    if not queries:
        top_skills = list(skills)[:3]
        if top_skills:
            queries.append(" ".join(top_skills) + " developer")
        elif profile.get("summary"):
            first_words = re.findall(r"[A-Za-z0-9+#.-]+", profile["summary"])[:5]
            queries.append(" ".join(first_words) + " jobs")
    return queries[:3]


def _normalize_adzuna(item: Dict[str, Any], country_code: str) -> Dict[str, Any]:
    location = item.get("location") or {}
    company = item.get("company") or {}
    salary_min, salary_max = item.get("salary_min"), item.get("salary_max")
    currency = CURRENCY_BY_COUNTRY.get(country_code, "")
    salary = None
    if salary_min is not None or salary_max is not None:
        low = f"{currency} {salary_min:,.0f}" if salary_min is not None and currency else str(salary_min or "")
        high = f"{currency} {salary_max:,.0f}" if salary_max is not None and currency else str(salary_max or "")
        salary = f"{low} - {high}".strip(" -")
    return {
        "id": f"adzuna:{item.get('id', '')}",
        "title": item.get("title") or "Untitled role",
        "company": company.get("display_name") or "Company not listed",
        "location": location.get("display_name") or "Location not listed",
        "description": item.get("description") or "",
        "posted_at": item.get("created"),
        "salary": salary,
        "employment_type": item.get("contract_time") or item.get("contract_type"),
        "work_mode": "remote" if item.get("remote") else None,
        "source": "Adzuna",
        "source_links": [{"label": "View on Adzuna", "url": item.get("redirect_url", "")}],
    }


def _normalize_google_job(item: Dict[str, Any]) -> Dict[str, Any]:
    extensions = item.get("detected_extensions") or {}
    apply_options = item.get("apply_options") or []
    links = []
    for option in apply_options:
        url = option.get("link")
        if url:
            links.append({"label": f"Apply via {option.get('title') or 'job site'}", "url": url})
    if not links and item.get("share_link"):
        links.append({"label": "View on Google Jobs", "url": item["share_link"]})
    via = item.get("via") or "Google Jobs"
    return {
        "id": f"google:{item.get('job_id') or item.get('share_link') or item.get('title', '')}",
        "title": item.get("title") or "Untitled role",
        "company": item.get("company_name") or "Company not listed",
        "location": item.get("location") or "Location not listed",
        "description": item.get("description") or "",
        "posted_at": extensions.get("posted_at"),
        "salary": extensions.get("salary"),
        "employment_type": extensions.get("schedule_type"),
        "work_mode": "remote" if extensions.get("work_from_home") else None,
        "source": f"Google Jobs via {via}",
        "source_links": links,
    }


def _plain_text(value: Any) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"(?i)<br\s*/?>|</p>|</li>|</h[1-6]>", " ", text)
    return re.sub(r"<[^>]+>", " ", text).strip()


def _normalize_jobicy(item: Dict[str, Any]) -> Dict[str, Any]:
    salary = None
    salary_min, salary_max = item.get("salaryMin"), item.get("salaryMax")
    if salary_min is not None or salary_max is not None:
        currency = item.get("salaryCurrency") or ""
        low = f"{currency} {salary_min:,.0f}" if salary_min is not None else ""
        high = f"{currency} {salary_max:,.0f}" if salary_max is not None else ""
        period = item.get("salaryPeriod")
        salary = f"{low} - {high}".strip(" -") + (f" / {period}" if period else "")
    job_types = item.get("jobType") or []
    if isinstance(job_types, str):
        employment_type = job_types
    else:
        employment_type = ", ".join(str(value) for value in job_types) or None
    return {
        "id": f"jobicy:{item.get('id', item.get('url', ''))}",
        "title": item.get("jobTitle") or "Untitled role",
        "company": item.get("companyName") or "Company not listed",
        "location": item.get("jobGeo") or "Remote",
        "description": _plain_text(item.get("jobDescription") or item.get("jobExcerpt")),
        "posted_at": item.get("pubDate"),
        "salary": salary,
        "employment_type": employment_type,
        "work_mode": "remote",
        "source": "Jobicy (free remote jobs)",
        "source_links": [{"label": "View on Jobicy", "url": item.get("url", "")}],
    }


async def _search_adzuna(client: httpx.AsyncClient, query: str, request: JobDiscoveryRequest) -> List[Dict[str, Any]]:
    url = f"https://api.adzuna.com/v1/api/jobs/{request.country_code.lower()}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 20,
        "what": query,
        "where": request.location,
        "content-type": "application/json",
        "sort_by": "date",
    }
    response = await client.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    return [_normalize_adzuna(item, request.country_code.lower()) for item in data.get("results", [])]


async def _search_google_jobs(client: httpx.AsyncClient, query: str, request: JobDiscoveryRequest) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    next_page_token = None
    pages = 2 if request.max_results == 20 else 1
    for _ in range(pages):
        params = {
            "engine": "google_jobs",
            "q": query,
            "location": request.location,
            "gl": request.country_code.lower(),
            "hl": "en",
            "api_key": SERPAPI_API_KEY,
        }
        if next_page_token:
            params["next_page_token"] = next_page_token
        response = await client.get("https://serpapi.com/search.json", params=params)
        response.raise_for_status()
        data = response.json()
        if data.get("error"):
            raise RuntimeError(data["error"])
        results.extend(_normalize_google_job(item) for item in data.get("jobs_results", []))
        next_page_token = (data.get("serpapi_pagination") or {}).get("next_page_token")
        if not next_page_token:
            break
    return results


async def _search_jobicy(client: httpx.AsyncClient, query: str, request: JobDiscoveryRequest) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {"count": 100}
    geo = JOBICY_GEO_BY_COUNTRY.get(request.country_code.lower())
    if geo:
        params["geo"] = geo
    if query:
        params["tag"] = query
    response = await client.get("https://jobicy.com/api/jobs", params=params)
    response.raise_for_status()
    data = response.json()
    if data.get("success") is False:
        raise RuntimeError(data.get("error") or "Jobicy returned an unsuccessful response")
    return [_normalize_jobicy(item) for item in data.get("jobs", [])]


def _match_job(job: Dict[str, Any], request: JobDiscoveryRequest, profile_skills: set[str], search_queries: List[str]) -> DiscoveredJob:
    text = f"{job['title']} {job['description']}"
    job_skills = set(extract_jd_skills(text))
    matched = sorted(profile_skills & job_skills)
    missing = sorted(job_skills - profile_skills)
    title = normalize_skill(job["title"])
    role_score = max((SequenceMatcher(None, title, normalize_skill(query)).ratio() * 100 for query in search_queries), default=0)
    skill_score = (len(matched) / max(len(job_skills), 1)) * 100 if job_skills else role_score
    score = round(max(0, min(100, (skill_score * 0.72) + (role_score * 0.28))))

    reasons = []
    if matched:
        reasons.append(f"Your profile matches {len(matched)} listed skill{'' if len(matched) == 1 else 's'}: {', '.join(matched[:4])}.")
    if role_score >= 55:
        reasons.append("The job title aligns with roles suggested by your profile.")
    if not reasons:
        reasons.append("This listing is related to a role suggested by your profile; review the details before applying.")

    return DiscoveredJob(
        **job,
        match_score=score,
        matched_skills=matched[:8],
        missing_skills=missing[:8],
        match_reasons=reasons,
    )


def _matches_work_mode(job: Dict[str, Any], work_mode: str) -> bool:
    if work_mode == "any":
        return True
    explicit = (job.get("work_mode") or "").lower()
    text = f"{job['location']} {job['title']} {job['description']} {job.get('employment_type') or ''} {explicit}".lower()
    if work_mode == "remote":
        return any(term in text for term in ("remote", "work from home", "anywhere"))
    if work_mode == "hybrid":
        return "hybrid" in text
    return not any(term in text for term in ("remote", "work from home", "hybrid"))


async def discover_jobs(request: JobDiscoveryRequest) -> Tuple[List[DiscoveredJob], int, List[str], List[str], List[str]]:
    country_code = request.country_code.strip().lower()
    if not re.fullmatch(r"[a-z]{2}", country_code):
        raise ValueError("Choose a valid two-letter country code for job search.")
    adzuna_available = bool(ADZUNA_APP_ID and ADZUNA_APP_KEY and country_code in ADZUNA_COUNTRIES)
    initial_warnings: List[str] = []
    if ADZUNA_APP_ID and ADZUNA_APP_KEY and country_code not in ADZUNA_COUNTRIES:
        initial_warnings.append("Adzuna does not cover this market, so its results were skipped.")
    warnings: List[str] = list(initial_warnings)
    queries = _search_queries(request)
    if not queries:
        raise ValueError("Add skills, a current title, summary, experience, or projects to your profile before searching for jobs.")

    providers = []
    if adzuna_available:
        providers.append("Adzuna")
    if SERPAPI_API_KEY:
        providers.append("Google Jobs (via SerpApi)")
    jobicy_available = request.work_mode in ("any", "remote")
    if jobicy_available:
        providers.append("Jobicy (free public remote jobs)")
        warnings.append("Jobicy is the no-key free source: it returns remote jobs for the selected geographic market, published within the last 7 days. It does not provide city-specific on-site or hybrid listings.")
    else:
        warnings.append("The free Jobicy source only has remote listings. Add a paid-provider key for local hybrid/on-site search, or switch the work arrangement to Any or Remote.")

    raw_jobs: List[Dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=8.0), follow_redirects=True) as client:
        tasks = []
        if adzuna_available:
            tasks.extend(("Adzuna", query, _search_adzuna(client, _query_for_mode(query, request.work_mode), request)) for query in queries)
        if SERPAPI_API_KEY:
            tasks.append(("Google Jobs (via SerpApi)", queries[0], _search_google_jobs(client, _query_for_mode(queries[0], request.work_mode), request)))
        if jobicy_available:
            tasks.extend(("Jobicy", query, _search_jobicy(client, query, request)) for query in queries)

        outcomes = await asyncio.gather(*(task[2] for task in tasks), return_exceptions=True)
        for (provider, query, _), outcome in zip(tasks, outcomes):
            if isinstance(outcome, Exception):
                warnings.append(f"{provider} search for '{query}' failed: {type(outcome).__name__}.")
            else:
                raw_jobs.extend(outcome)

        # The free feed's title-tag filter can be very narrow. If it returns
        # fewer than requested, broaden once to the same eligible geography;
        # profile matching below will rank that small regional feed locally.
        jobicy_count = sum(1 for job in raw_jobs if job.get("source") == "Jobicy (free remote jobs)")
        if jobicy_available and jobicy_count < request.max_results:
            try:
                raw_jobs.extend(await _search_jobicy(client, "", request))
            except Exception as exc:
                warnings.append(f"Jobicy broad regional search failed: {type(exc).__name__}.")

    candidate_skills = set(extract_skills_from_profile(request.profile.model_dump()))
    deduped: Dict[str, Dict[str, Any]] = {}
    for job in raw_jobs:
        if not job.get("source_links"):
            continue
        if not _matches_work_mode(job, request.work_mode):
            continue
        key = "|".join(normalize_skill(job.get(field, "")) for field in ("title", "company", "location"))
        if key in deduped:
            existing = deduped[key]
            existing["source"] = f"{existing['source']} + {job['source']}"
            existing["source_links"].extend(job["source_links"])
        else:
            deduped[key] = job

    ranked = [_match_job(job, request, candidate_skills, queries) for job in deduped.values()]
    ranked.sort(key=lambda job: (job.match_score, job.posted_at or ""), reverse=True)
    if not ranked and not warnings:
        warnings.append("The job sources returned no matching listings. Try a nearby city or a broader work mode.")
    return ranked[:request.max_results], len(ranked), queries, providers, warnings
