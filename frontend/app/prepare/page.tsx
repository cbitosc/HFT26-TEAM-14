"use client";

import Link from "next/link";
import PreparationPlanner from "@/components/PreparationPlanner";
import { useProfile } from "@/lib/profile-context";

export default function PreparePage() {
  const { profile, isHydrated } = useProfile();
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Career readiness coach</p><h1 className="mt-1 text-3xl font-black text-slate-950">Prepare for a job</h1><p className="mt-2 max-w-3xl text-slate-600">Turn recent job-market signals into a personalized skill plan, portfolio tasks, and resume actions based on your current profile.</p></div>
          <Link href="/jobs" className="text-sm font-semibold text-brand-700 hover:underline">Browse matching jobs →</Link>
        </div>
        {!isHydrated ? <p className="rounded-xl bg-white p-5 text-slate-600">Loading your saved profile…</p> : <PreparationPlanner profile={profile} />}
      </div>
    </main>
  );
}
