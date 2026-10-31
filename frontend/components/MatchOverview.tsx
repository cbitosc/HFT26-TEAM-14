"use client";

export default function MatchOverview({ data }: { data?: any }) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">Match Overview</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
          {data.match_score}% fit
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 text-sm text-slate-600">JD alignment</div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${data.match_score}%` }} />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-700">Summary</div>
          <p className="mt-2 text-sm text-slate-600">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}
