"use client";

import Link from "next/link";
import JobDiscovery from "@/components/JobDiscovery";
import { useProfile } from "@/lib/profile-context";

export default function JobsPage() {
  const { profile, isHydrated } = useProfile();
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">AI-assisted job search</p><h1 className="mt-1 text-3xl font-black text-slate-950">Find jobs that fit your profile</h1><p className="mt-2 max-w-3xl text-slate-600">Search live job listings by your area. We suggest roles from your skills and experience, then rank openings by how closely their available requirements match your resume.</p></div><Link href="/analyze" className="text-sm font-semibold text-brand-700 hover:underline">I already have a job description →</Link></div>
        {!isHydrated ? <p className="rounded-xl bg-white p-5 text-slate-600">Loading your saved profile…</p> : <JobDiscovery profile={profile} />}
      </div>
    </main>
  );
}
