"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { prepareForJob } from "@/lib/api";
import type { PreparationResponse, Profile } from "@/lib/types";

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const markets = [
  { code: "in", name: "India" }, { code: "us", name: "United States" }, { code: "gb", name: "United Kingdom" },
  { code: "ca", name: "Canada" }, { code: "au", name: "Australia" }, { code: "sg", name: "Singapore" },
  { code: "nz", name: "New Zealand" }, { code: "de", name: "Germany" }, { code: "fr", name: "France" },
  { code: "nl", name: "Netherlands" }, { code: "it", name: "Italy" }, { code: "es", name: "Spain" },
  { code: "be", name: "Belgium" }, { code: "at", name: "Austria" }, { code: "pl", name: "Poland" },
  { code: "br", name: "Brazil" }, { code: "mx", name: "Mexico" }, { code: "za", name: "South Africa" },
];

function marketFromLocation(location: string) {
  const normalized = location.toLowerCase().trim();
  return markets.find((market) => normalized.endsWith(market.name.toLowerCase()))?.code ?? "";
}

type Props = { profile: Profile };

export default function PreparationPlanner({ profile }: Props) {
  const [targetRole, setTargetRole] = useState(profile.current_title || "");
  const [countryCode, setCountryCode] = useState(marketFromLocation(profile.location));
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [result, setResult] = useState<PreparationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role) setTargetRole(role);
  }, []);

  const generatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!countryCode) {
      setError("Choose the country or market where you want to work.");
      return;
    }
    if (!profile.skills.length && !profile.current_title && !profile.summary && !profile.projects.length) {
      setError("Complete your Profile with a title, skills, summary, or projects first.");
      return;
    }
    setLoading(true);
    try {
      const data = await prepareForJob({
        profile,
        country_code: countryCode,
        target_role: targetRole.trim(),
        weekly_hours: weeklyHours,
      }) as PreparationResponse;
      setResult(data);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Market preparation could not reach the live job source. Check the backend and internet connection, then retry.");
    } finally {
      setLoading(false);
    }
  };

  const hasProfile = Boolean(profile.skills.length || profile.current_title || profile.summary || profile.projects.length);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <form onSubmit={generatePlan} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Your preparation goal</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">We compare your profile with recent listings, then build a skill plan around your career stage.</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">Role you want<input className={inputClass} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="e.g. Data Analyst" /></label>
          <label className="mt-4 block text-sm font-medium text-slate-700">Target market<select className={inputClass} value={countryCode} onChange={(event) => setCountryCode(event.target.value)}><option value="">Choose country</option>{markets.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}</select></label>
          <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-800">Career stage: {profile.career_stage.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-slate-500">Change this in Profile. Final-year status increases preparation urgency; early-stage profiles get a foundation-first plan.</p><Link href="/profile" className="mt-2 inline-flex text-xs font-semibold text-brand-700 hover:underline">Update career stage →</Link></div>
          <label className="mt-4 block text-sm font-medium text-slate-700">Study time per week<select className={inputClass} value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))}><option value={3}>3 hours</option><option value={6}>6 hours</option><option value={10}>10 hours</option><option value={15}>15 hours</option><option value={20}>20 hours</option></select></label>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{loading ? "Reading current job market…" : "Build my preparation plan"}</button>
          <p className="mt-3 text-xs leading-5 text-slate-500">No Adzuna key is needed. The free source is remote-focused and reflects a recent regional sample, not every local vacancy.</p>
        </form>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5"><h3 className="text-sm font-bold text-brand-900">Already have a job description?</h3><p className="mt-1 text-sm leading-5 text-brand-800">Use the Analyzer for a precise comparison against one specific opening.</p><Link href="/analyze" className="mt-3 inline-flex text-sm font-semibold text-brand-800 hover:underline">Open Analyzer →</Link></div>
      </aside>

      <section aria-live="polite" className="min-h-[520px] space-y-4">
        {!result && !loading && <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="text-4xl">✦</div><h2 className="mt-4 text-xl font-bold text-slate-900">Prepare for the role you want</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">{hasProfile ? "Choose a target role and market. We’ll show the skills appearing in recent postings, your profile gaps, and a paced plan with portfolio work." : "Add your skills and projects in Profile first. The plan uses your experience and evidence to personalize preparation."}</p>{!hasProfile && <Link href="/profile" className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Complete my profile</Link>}</div>}
        {loading && <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600">Comparing your profile with recent job listings…</div>}
        {result && <>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Personalized market prep</p><h2 className="mt-1 text-2xl font-black text-slate-950">{result.target_role}</h2><p className="mt-2 text-sm text-slate-600">{result.career_stage} · {result.weekly_hours} study hours/week · estimated {result.plan_weeks}-week plan</p></div><div className="min-w-[130px] rounded-2xl bg-brand-50 px-4 py-3 text-center"><div className="text-3xl font-black text-brand-700">{result.readiness_score}%</div><div className="text-xs font-semibold text-brand-900">resume evidence estimate</div><div className="mt-1 text-xs text-brand-700">{result.readiness_label}</div><div className="mt-2 max-w-[180px] text-[11px] leading-4 text-slate-500">Based on role-skill coverage and work/project evidence, not hiring odds.</div></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Recent listings sampled</div><div className="mt-1 text-lg font-bold text-slate-900">{result.market_sample_count}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Sources</div><div className="mt-1 text-sm font-semibold text-slate-900">{result.sources.join(", ") || "Unavailable"}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Market scope</div><div className="mt-1 text-sm font-semibold text-slate-900">{result.market_scope}</div></div></div>
          </div>

          {result.warnings.map((warning, index) => <p key={`warning-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">{warning}</p>)}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h3 className="text-lg font-bold text-slate-900">{result.market_sample_count ? "Skills showing up in the market" : "Role skill baseline"}</h3><p className="mt-1 text-sm text-slate-500">{result.market_sample_count ? "Share of sampled listings mentioning each skill; repeated job ads count once." : "No live listings were available, so these are role-baseline skills rather than current demand signals."}</p><div className="mt-4 space-y-3">{result.market_skills.length ? result.market_skills.map((skill) => <div key={skill.skill} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-900">{skill.skill}</span><span className="text-sm font-bold text-brand-700">{skill.market_demand_percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${skill.market_demand_percent}%` }} /></div><p className="mt-1 text-xs text-slate-500">{skill.market_demand_count} of {result.market_sample_count} listings · {profile.skills.some((item) => item.toLowerCase() === skill.skill.toLowerCase()) ? "already in your profile" : `${skill.difficulty} to build`}</p></div>) : <p className="text-sm text-slate-500">No recognized skill mentions were found in the live sample.</p>}</div>{result.profile_strengths.length > 0 && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Your market-aligned strengths:</strong> {result.profile_strengths.join(", ")}</p>}</div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h3 className="text-lg font-bold text-slate-900">Your skill-building priorities</h3><p className="mt-1 text-sm text-slate-500">Priority balances market frequency (55%), your profile gap (30%), and career-stage urgency (15%). Difficulty reflects prerequisites already present in your profile.</p><div className="mt-4 space-y-3">{result.skills_to_build.length ? result.skills_to_build.map((skill) => <article key={skill.skill} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold text-slate-900">{skill.skill}</h4><div className="flex gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{skill.priority} priority</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{skill.difficulty}</span></div></div><p className="mt-2 text-sm leading-5 text-slate-600">{skill.reason}</p><p className="mt-2 text-xs font-semibold text-slate-700">Estimated learning effort: about {skill.estimated_hours} hours</p><ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-slate-600">{skill.learning_path.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900"><strong>Portfolio task:</strong> {skill.portfolio_task}</p></article>) : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Your profile covers the recognized in-demand skills in this sample. Strengthen project evidence and tailor your resume to the target role.</p>}</div></div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">Your preparation roadmap</h3><p className="mt-1 text-sm text-slate-500">A realistic weekly sequence based on your time budget. Adjust the pace as needed.</p></div><Link href="/builder" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Update my resume</Link></div><div className="mt-5 grid gap-3 md:grid-cols-2">{result.plan.map((item) => <div key={item.week} className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-brand-700">{item.title}</div><p className="mt-2 text-sm font-semibold text-slate-900">{item.focus}</p><p className="mt-1 text-sm leading-5 text-slate-600">{item.deliverable}</p></div>)}</div></div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h3 className="text-lg font-bold text-slate-900">Resume actions</h3><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">{result.resume_actions.map((action) => <li key={action}>✓ {action}</li>)}</ul><p className="mt-4 text-xs leading-5 text-slate-500">The readiness percentage is a resume-evidence estimate, not a hiring probability. Market demand is measured from the sampled listings and is not a full labor-market census.</p></div>
        </>}
      </section>
    </div>
  );
}
