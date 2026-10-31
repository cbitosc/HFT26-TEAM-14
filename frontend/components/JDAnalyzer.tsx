"use client";

import { useState } from "react";
import Link from "next/link";
import { analyzeProfile, exportDocx, exportPdf } from "@/lib/api";
import type { AnalysisResponse, Profile } from "@/lib/types";

type ExportFormat = "pdf" | "docx";
type Props = { profile: Profile; onResult: (data: AnalysisResponse | null) => void };

export default function JDAnalyzer({ profile, onResult }: Props) {
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      setError("Paste a job description before analyzing.");
      setResult(null);
      onResult(null);
      return;
    }

    const hasProfileContent = Boolean(profile.summary.trim() || profile.skills.length || profile.experience.length || profile.projects.length);
    if (!hasProfileContent) {
      setError("Add your summary, skills, experience, or projects to your profile before analyzing a job.");
      setResult(null);
      onResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    onResult(null);

    try {
      const data = await analyzeProfile({ profile, jd: { raw_text: jdText.trim(), title: jobTitle.trim() } });
      setResult(data as AnalysisResponse);
      onResult(data as AnalysisResponse);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Analysis failed. Check that the backend is running and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResume = async (format: ExportFormat) => {
    if (!result) return;
    setDownloading(format);
    setError("");
    try {
      const response = format === "pdf"
        ? await exportPdf({ profile, analysis: result })
        : await exportDocx({ profile, analysis: result });
      const fileUrl = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      const safeName = profile.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resume";
      anchor.href = fileUrl;
      anchor.download = `${safeName}-resume.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : `Could not download the ${format.toUpperCase()} resume. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold text-slate-900">Job description analyzer</h2><p className="mt-1 text-sm text-slate-500">Analysis uses your saved profile.</p></div>
        <Link href="/profile" className="text-sm font-semibold text-brand-700 hover:underline">Edit profile →</Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Target role (optional)<input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="e.g. Product Engineer" /></label>
        <div className="flex items-end"><p className="text-sm text-slate-500">Profile: {profile.name || "No name set"}{profile.skills.length > 0 ? ` · ${profile.skills.length} skills` : ""}</p></div>
      </div>
      <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Paste the full job description here…" aria-label="Job description" />

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={handleAnalyze} disabled={isLoading} className="mt-4 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isLoading ? "Analyzing…" : "Analyze job description"}</button>

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="text-sm text-slate-500">Job match score</div><div className="text-3xl font-black text-brand-600">{result.match_score}%</div></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void downloadResume("pdf")} disabled={downloading !== null} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{downloading === "pdf" ? "Preparing PDF…" : "Download PDF"}</button><button type="button" onClick={() => void downloadResume("docx")} disabled={downloading !== null} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60">{downloading === "docx" ? "Preparing DOCX…" : "Download DOCX"}</button></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{result.summary}</p>
          {result.description_fit && <p className="mt-2 text-sm leading-6 text-slate-600">{result.description_fit}</p>}
          <div className="mt-5"><div className="text-sm font-semibold text-slate-700">Strong skills</div><div className="mt-2 flex flex-wrap gap-2">{result.strong_skills?.map((skill) => <span key={skill.skill} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">{skill.skill}</span>)}</div></div>
          <div className="mt-4"><div className="text-sm font-semibold text-slate-700">Missing skills</div><div className="mt-2 flex flex-wrap gap-2">{result.missing_skills?.map((skill) => <span key={skill.skill} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">{skill.skill}</span>)}</div></div>
        </div>
      )}
    </section>
  );
}
