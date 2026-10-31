"use client";

export default function SkillGapPanel({ data }: { data?: any }) {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-xl font-bold text-slate-900">Skill gap + roadmap</h3>

      <div className="mt-6 space-y-5">
        {data.missing_skills?.map((skill: any) => (
          <div key={skill.skill} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-slate-800">{skill.skill}</div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">{skill.importance}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{skill.reason}</p>
            <p className="mt-2 text-xs text-slate-500">Recommended path: {skill.recommended_learning_path}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="text-sm font-semibold text-slate-700">Learning roadmap</div>
        <div className="mt-3 space-y-3">
          {data.skill_roadmap?.map((item: any) => (
            <div key={item.skill} className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
              <div>
                <div className="font-medium text-slate-800">{item.skill}</div>
                <div className="text-xs text-slate-500">{item.reason}</div>
              </div>
              <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700">{item.timeline}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
