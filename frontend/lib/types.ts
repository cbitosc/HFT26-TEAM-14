export type ExperienceEntry = {
  company: string;
  role: string;
  duration: string;
  bullets: string[];
};

export type ProjectEntry = {
  name: string;
  description: string;
  tech_stack: string[];
  impact: string;
};

export type EducationEntry = {
  degree: string;
  institution: string;
  year: string;
};

export type Profile = {
  name: string;
  email: string;
  location: string;
  current_title: string;
  years_experience: number;
  career_stage: "student" | "final_year" | "fresher" | "early_career" | "experienced";
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: string[];
};

export type AnalysisResponse = {
  match_score: number;
  summary: string;
  strong_skills: { skill: string; match_strength: string }[];
  missing_skills: SkillGap[];
  keyword_gap: string[];
  description_fit: string;
  skill_roadmap: { skill: string; priority: string; timeline: string; reason: string }[];
  job_recommendations: { role: string; fit_score: number; reasons: string[] }[];
  suggestions: { section: string; content: string; score_delta: number }[];
  resume_summary_rewrite: string;
};

export type SkillGap = {
  skill: string;
  importance: string;
  reason: string;
  recommended_learning_path: string;
};

export type DiscoveredJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  posted_at?: string | null;
  salary?: string | null;
  employment_type?: string | null;
  work_mode?: string | null;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  match_reasons: string[];
  source: string;
  source_links: { label: string; url: string }[];
};

export type JobDiscoveryResponse = {
  jobs: DiscoveredJob[];
  total_found: number;
  location: string;
  country_code: string;
  search_queries: string[];
  sources_searched: string[];
  warnings: string[];
};

export type PreparationSkill = {
  skill: string;
  market_demand_count: number;
  market_demand_percent: number;
  priority_score: number;
  priority: string;
  difficulty: string;
  estimated_hours: number;
  reason: string;
  learning_path: string[];
  portfolio_task: string;
};

export type PreparationResponse = {
  target_role: string;
  career_stage: string;
  readiness_score: number;
  readiness_label: string;
  market_sample_count: number;
  market_scope: string;
  sources: string[];
  market_skills: PreparationSkill[];
  profile_strengths: string[];
  skills_to_build: PreparationSkill[];
  plan_weeks: number;
  weekly_hours: number;
  plan: { week: number; title: string; focus: string; deliverable: string }[];
  resume_actions: string[];
  warnings: string[];
};
