"use client";

import ProfileEditor from "@/components/ProfileEditor";
import Link from "next/link";
import ResumePreview from "@/components/ResumePreview";
import SaveStatus from "@/components/SaveStatus";
import { useProfile } from "@/lib/profile-context";

export default function ResumeBuilder() {
  const { profile, setProfile, saveState, saveNow, isHydrated } = useProfile();
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Resume studio</p><h1 className="mt-1 text-3xl font-black text-slate-950">Edit your resume</h1><p className="mt-2 text-slate-600">Every field below updates the preview and is saved automatically.</p></div>
          <div className="flex flex-wrap items-center gap-3"><SaveStatus state={saveState} /><Link href="/prepare" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Prepare for a job</Link><button type="button" onClick={() => saveNow()} disabled={!isHydrated} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Save now</button><button type="button" onClick={() => window.print()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Print / Save as PDF</button></div>
        </div>
        {!isHydrated ? <p className="rounded-xl bg-white p-5 text-slate-600">Loading your saved profile…</p> : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]">
            <div className="print:hidden"><ProfileEditor profile={profile} onChange={setProfile} /></div>
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-200/60 p-3 sm:p-6"><ResumePreview profile={profile} /></div>
          </div>
        )}
      </div>
    </main>
  );
}
