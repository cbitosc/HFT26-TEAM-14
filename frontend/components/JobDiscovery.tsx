"use client";

import { useState } from "react";
import Link from "next/link";
import { discoverJobs } from "@/lib/api";
import type { JobDiscoveryResponse, Profile } from "@/lib/types";

type WorkMode = "any" | "remote" | "hybrid" | "onsite";
const markets = [
  { code: "in", name: "India" }, { code: "us", name: "United States" }, { code: "gb", name: "United Kingdom" },
  { code: "ca", name: "Canada" }, { code: "au", name: "Australia" }, { code: "sg", name: "Singapore" },
  { code: "nz", name: "New Zealand" }, { code: "de", name: "Germany" }, { code: "fr", name: "France" },
  { code: "nl", name: "Netherlands" }, { code: "it", name: "Italy" }, { code: "es", name: "Spain" },
  { code: "be", name: "Belgium" }, { code: "at", name: "Austria" }, { code: "pl", name: "Poland" },
  { code: "br", name: "Brazil" }, { code: "mx", name: "Mexico" }, { code: "za", name: "South Africa" },
];
const adzunaDomains: Record<string, string> = {
  at: "adzuna.at", au: "adzuna.com.au", be: "adzuna.be", br: "adzuna.com.br", ca: "adzuna.ca",
  de: "adzuna.de", es: "adzuna.es", fr: "adzuna.fr", gb: "adzuna.co.uk", in: "adzuna.in",
  it: "adzuna.it", mx: "adzuna.com.mx", nl: "adzuna.nl", nz: "adzuna.co.nz", pl: "adzuna.pl",
  sg: "adzuna.com.sg", us: "adzuna.com", za: "adzuna.co.za",
};

function inferMarket(location: string) {
  const normalized = location.toLowerCase().trim();
  return markets.find((market) => normalized.endsWith(market.name.toLowerCase()))?.code ?? "";
}

function postedLabel(value?: string | null) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatSalary(value?: string | null) {
  return value || "Salary not listed";
}

type Props = { profile: Profile };

export default function JobDiscovery({ profile }: Props) {
  const [location, setLocation] = useState(profile.location || "");
  const [countryCode, setCountryCode] = useState(inferMarket(profile.location || ""));
  const [maxResults, setMaxResults] = useState<10 | 20>(10);
  const [workMode, setWorkMode] = useState<WorkMode>("any");
  const [results, setResults] = useState<JobDiscoveryResponse | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResults(null);
    if (!location.trim()) {
      setError("Enter the city or area where you want to work.");
      return;
    }
    if (!countryCode) {
      setError("Choose the country where you want to find jobs.");
      return;
    }
    if (!profile.name.trim() && !profile.summary.trim() && !profile.skills.length && !profile.experience.length && !profile.projects.length) {
      setError("Add skills, work history, projects, or a summary to your profile before searching.");
      return;
    }

    setIsSearching(true);
    try {
      const response = await discoverJobs({
        profile,
        location: location.trim(),
        country_code: countryCode,
        max_results: maxResults,
        work_mode: workMode,
      }) as JobDiscoveryResponse;
      setResults(response);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Job search could not reach the configured job sources. Try again in a moment.");
    } finally {
      setIsSearching(false);
    }
  };

  const hasProfile = Boolean(profile.summary.trim() || profile.skills.length || profile.experience.length || profile.projects.length);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <form onSubmit={search} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Search preferences</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">We suggest job titles from your profile. A free source is available for remote listings; city-specific local jobs need another provider.</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">City or area<input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="e.g. Bengaluru" /></label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Country / job market<select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"><option value="">Choose a country</option>{markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}</select></label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Work arrangement<select value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"><option value="any">Any arrangement</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Number of jobs<select value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value) as 10 | 20)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"><option value={10}>Top 10</option><option value={20}>Top 20</option></select></label>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={isSearching} className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isSearching ? "Searching live jobs…" : "Find jobs for my profile"}</button>
          <p className="mt-3 text-xs leading-5 text-slate-500">Job sources receive only your search terms and chosen area. Your full resume stays on this app’s backend for match scoring.</p>
        </form>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <div className="text-sm font-bold text-brand-900">Have a job description?</div>
          <p className="mt-1 text-sm leading-5 text-brand-800">Switch to the original mode to analyze one specific opening and download a tailored resume.</p>
          <Link href="/analyze" className="mt-3 inline-flex text-sm font-semibold text-brand-800 hover:underline">Analyze a job description →</Link>
        </div>
      </aside>

      <section aria-live="polite" className="min-h-[420px]">
        {!results && !isSearching && <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="text-4xl">⌕</div><h2 className="mt-4 text-xl font-bold text-slate-900">Your next role starts here</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{hasProfile ? "Choose your area and we’ll search live listings, compare them with your profile, and rank the strongest matches." : "Add your skills and experience to your Profile first. We use those details to suggest role types and score each listing."}</p>{!hasProfile && <Link href="/profile" className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Complete my profile</Link>}</div>}
        {isSearching && <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600">Searching job sources and matching listings to your profile…</div>}
        {results && <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Profile-based discovery</p><h2 className="mt-1 text-2xl font-black text-slate-950">Top {results.jobs.length} matches near {results.location}</h2><p className="mt-1 text-sm text-slate-600">{results.total_found} distinct listings reviewed · ranked by profile fit and posting date</p></div><div className="text-sm text-slate-500">Sources: {results.sources_searched.join(", ") || "none configured"}</div></div>
          {results.warnings.map((warning, index) => <p key={`warning-${index}`} className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{warning}</p>)}
          {results.search_queries.length > 0 && <p className="mb-4 text-xs text-slate-500">Suggested searches: {results.search_queries.join(" · ")}</p>}
          {results.jobs.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No live jobs matched these filters. Try a nearby city, another work arrangement, or update the skills in your profile.</div>}
          <div className="space-y-4">
            {results.jobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-brand-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1"><h3 className="text-lg font-bold text-slate-950">{job.title}</h3><p className="mt-1 font-medium text-slate-700">{job.company}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500"><span>{job.location}</span><span>{postedLabel(job.posted_at)}</span>{job.employment_type && <span>{job.employment_type}</span>}{job.work_mode && <span className="capitalize">{job.work_mode}</span>}</div></div>
                  <div className="min-w-[120px] rounded-xl bg-emerald-50 px-3 py-2 text-center"><div className="text-2xl font-black text-emerald-700">{job.match_score}%</div><div className="text-xs font-semibold text-emerald-800">profile match</div></div>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">{formatSalary(job.salary)}</p>
                <Link href={`/prepare?role=${encodeURIComponent(job.title)}`} className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline">Prepare for this role →</Link>
                {job.description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{job.description}</p>}
                <ul className="mt-3 space-y-1 text-sm text-slate-600">{job.match_reasons.map((reason, index) => <li key={`reason-${index}`}>• {reason}</li>)}</ul>
                {job.matched_skills.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{job.matched_skills.map((skill) => <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">{skill}</span>)}{job.missing_skills.slice(0, 4).map((skill) => <span key={`missing-${skill}`} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">Learn: {skill}</span>)}</div>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-slate-500">Found on {job.source}</span>{job.source_links.some((source) => source.label === "View on Adzuna") && <a href={`https://www.${adzunaDomains[results.country_code] || "adzuna.com"}/`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[23px] min-w-[116px] items-center justify-center rounded border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700">Adzuna</a>}</div><div className="flex flex-wrap gap-2">{job.source_links.map((source, index) => <a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">{index === 0 ? "View & apply" : source.label}</a>)}</div></div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Match scores are estimates based on the job title and description text supplied by the listing source. Always review the original posting for current requirements and application details.</p>
        </>}
      </section>
    </div>
  );
}
