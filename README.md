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

## Using the website

1. Open **Profile** and enter your name, contact details, title, career stage, summary, skills, work history, projects, education, and certifications.
2. Changes autosave in the current browser. The **Save now** button forces an immediate save; the status label confirms when it is saved.
3. Open **Resume editor** to edit the same profile while viewing a live resume preview. Use **Print / Save as PDF** for a quick local copy.
4. Open **Analyzer**, paste a job description, optionally enter the target role, and choose **Analyze job description**. The analyzer uses the profile you saved.
5. After the analysis completes, choose **Download PDF** or **Download DOCX** to save the resume with the job match summary.
6. Open **Settings** to download or restore a JSON backup, or clear the saved profile.

Profile autosave uses browser local storage, so it remains on the same browser and device and is not synced between devices. Job analysis sends the profile and job description to the configured backend; if the Featherless integration is enabled, the backend forwards the analysis request to Featherless. Configure the Featherless API key in `backend/.env` to enable AI analysis; without it, the backend uses its built-in fallback response.

## Profile-based job discovery

The **Find jobs** page has a no-job-description mode. It uses the saved profile to suggest role searches, requests live listings for the selected city and country, ranks the returned postings against profile skills and role titles, and links back to the original source to apply. Choose the top 10 or top 20, and filter by remote, hybrid, or on-site wording when the source exposes it. The existing **Analyzer** page remains the mode for comparing against one specific job description.

For free basic testing, the app now searches Jobicy's public remote jobs API without an account or API key. Its public feed is remote-only, covers geographic markets rather than individual cities, and contains recent listings (currently within the last 7 days). Original Jobicy listing links are preserved. This lets you test the profile-based matching immediately, but it will not find city-specific on-site or hybrid jobs.

For broader local listings, Adzuna is an optional provider; register at https://developer.adzuna.com/ and put the issued values in `backend/.env`:

```env
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

For Google Jobs results, optionally add a SerpApi key:

```env
SERPAPI_API_KEY=your_serpapi_key
```

Restart the backend after editing `backend/.env`. Adzuna’s public API returns shortened job-description snippets, so match scores are estimates based on the listing text returned and should be checked against the original posting. The job-search providers receive the generated role query and geographic area, not the full resume. Keep each provider's attribution and usage requirements in place.

## Prepare for a job

Open **Prepare for a job** from the navigation or Resume Editor. Select a target role, country, and weekly study-time budget. The planner compares the saved profile with recent listings, shows market-skill mention counts and profile gaps, estimates effort from adjacent skills, and creates portfolio tasks and a paced roadmap. Career stage is editable in Profile: it changes urgency and planning pace (for example, final-year students receive a more accelerated priority), not an assumption about ability. Market insights use the live providers configured for the selected country; the free Jobicy feed is remote-focused and recent, so counts are directional rather than a complete labor-market census. Verify skills through projects before adding them to a resume.
