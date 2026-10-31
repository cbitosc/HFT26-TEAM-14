"use client";

import { useState } from "react";
import JDAnalyzer from "@/components/JDAnalyzer";
import SkillGapPanel from "@/components/SkillGapPanel";
import { useProfile } from "@/lib/profile-context";
import type { AnalysisResponse } from "@/lib/types";

export default function AnalyzePage() {
  const { profile, isHydrated } = useProfile();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Personalized job fit</p><h1 className="mt-1 text-3xl font-black text-slate-950">Analyze your fit</h1><p className="mt-2 text-slate-600">Compare your saved profile with a job description, then download the tailored resume. For open-ended job search, use Find jobs.</p></div>
        {!isHydrated ? <p className="rounded-xl bg-white p-5 text-slate-600">Loading your saved profile…</p> : (
          <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <JDAnalyzer profile={profile} onResult={setAnalysis} />
            <SkillGapPanel data={analysis} />
          </div>
        )}
      </div>
    </main>
  );
}
