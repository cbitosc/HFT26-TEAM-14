"use client";

import type { SaveState } from "@/lib/profile-context";

const labels: Record<SaveState, string> = {
  loading: "Loading saved profile…",
  saving: "Saving changes…",
  saved: "All changes saved in this browser",
  error: "Could not save. Check browser storage settings.",
};

export default function SaveStatus({ state }: { state: SaveState }) {
  const color = state === "error" ? "text-red-700" : state === "saving" ? "text-amber-700" : "text-slate-500";
  return <span role="status" className={`text-sm ${color}`}>{labels[state]}</span>;
}
