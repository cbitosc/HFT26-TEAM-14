"use client";

import ProfileEditor from "@/components/ProfileEditor";
import SaveStatus from "@/components/SaveStatus";
import { useProfile } from "@/lib/profile-context";

export default function ProfilePage() {
  const { profile, setProfile, saveState, saveNow, isHydrated } = useProfile();
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Your information</p><h1 className="mt-1 text-3xl font-black text-slate-950">Profile</h1><p className="mt-2 text-slate-600">Edit the details shared with your resume, job analysis, and personalized preparation plan.</p></div>
          <div className="flex flex-wrap items-center gap-3"><SaveStatus state={saveState} /><button type="button" onClick={() => saveNow()} disabled={!isHydrated} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save now</button></div>
        </div>
        {!isHydrated ? <p className="rounded-xl bg-white p-5 text-slate-600">Loading your saved profile…</p> : <ProfileEditor profile={profile} onChange={setProfile} />}
      </div>
    </main>
  );
}
