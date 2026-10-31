import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Career Dashboard</h1>
            <p className="text-slate-600">Your profile intelligence, match score, and next recommended actions.</p>
          </div>
          <Link href="/analyze" className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white">
            Analyze new JD
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Match Score</div>
            <div className="mt-4 text-4xl font-black text-brand-600">87%</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Strong Skills</div>
            <div className="mt-4 text-lg font-bold text-slate-900">Python, SQL, React</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="text-sm text-slate-500">Recommended Roles</div>
            <div className="mt-4 text-lg font-bold text-slate-900">AI Engineer, Backend Engineer</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-bold text-slate-900">Skill roadmap</h3>
            <div className="mt-4 space-y-3">
              {["LLM", "RAG", "Prompt Engineering", "MLOps"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{item}</div>
                  <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700">High priority</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-bold text-slate-900">Suggested jobs for you</h3>
            <div className="mt-4 space-y-3">
              {[
                { role: "AI Engineer", score: 89 },
                { role: "Senior Product Engineer", score: 85 },
                { role: "Backend Engineer", score: 82 }
              ].map((job) => (
                <div key={job.role} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">{job.role}</div>
                  <span className="text-sm font-semibold text-brand-600">{job.score}% fit</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
