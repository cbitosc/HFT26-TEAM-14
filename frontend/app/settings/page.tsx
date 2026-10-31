"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import SaveStatus from "@/components/SaveStatus";
import { normalizeProfile, useProfile } from "@/lib/profile-context";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const { profile, setProfile, saveState, saveNow, resetProfile } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "careerfit-profile.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Profile backup downloaded.");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("The file must contain a profile object.");
      const candidate = parsed as Partial<Profile>;
      if (typeof candidate.name !== "string" || !Array.isArray(candidate.skills) || !Array.isArray(candidate.experience) || !Array.isArray(candidate.projects) || !Array.isArray(candidate.education) || !Array.isArray(candidate.certifications)) throw new Error("The file does not look like a CareerFit profile backup.");
      const restored = normalizeProfile(candidate);
      setProfile(restored);
      saveNow(restored);
      setMessage("Profile backup imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not import this profile file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearProfile = () => {
    if (!window.confirm("Clear your saved profile from this browser? This cannot be undone unless you exported a backup.")) return;
    resetProfile();
    setMessage("Saved profile cleared.");
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Preferences and data</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Settings</h1>
        <p className="mt-2 text-slate-600">Manage your saved profile and keep a portable backup.</p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Profile storage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your profile autosaves in this browser on this device. It is not synced to an account or another device. Analysis sends your profile and job description to the configured backend. If an AI provider is enabled, the backend may also send that information to the provider.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3"><SaveStatus state={saveState} /><button type="button" onClick={() => saveNow()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Save now</button></div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Backup and restore</h2>
          <p className="mt-2 text-sm text-slate-600">Export a JSON copy before changing browsers or clearing this profile.</p>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadBackup} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Download profile backup</button><button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Import profile backup</button><input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void importBackup(e.target.files?.[0])} /></div>
        </section>

        <section className="mt-5 rounded-2xl border border-red-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Clear saved profile</h2>
          <p className="mt-2 text-sm text-slate-600">Remove the current profile from browser storage. Export a backup first if you may need it later.</p>
          <button type="button" onClick={clearProfile} className="mt-4 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Clear profile data</button>
        </section>
        {message && <p role="status" className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-700">{message}</p>}
        <Link href="/profile" className="mt-6 inline-flex text-sm font-semibold text-brand-700 hover:underline">Edit profile details →</Link>
      </div>
    </main>
  );
}
