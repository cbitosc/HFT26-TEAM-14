import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <section className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
              AI-powered tailored resumes for the right jobs
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight">
              Tailor your resume to the exact job. <span className="text-brand-400">Before you apply.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Analyze your profile, compare with the job description, reveal missing skills, rewrite bullets,
              optimize ATS fit, and export a clean resume in PDF or DOCX.
            </p>

            <div className="mt-8 flex gap-4">
              <Link href="/jobs" className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-500/20">
                Find jobs for my profile
              </Link>
              <Link href="/analyze" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-semibold text-slate-100">
                Match a job description
              </Link>
              <Link href="/builder" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-semibold text-slate-100">
                Open editor
              </Link>
            </div>

            <div className="mt-10 flex gap-10 text-sm text-slate-400">
              <div><span className="text-2xl font-bold text-white">94%</span><br/>ATS compatibility</div>
              <div><span className="text-2xl font-bold text-white">8x</span><br/>faster tailoring</div>
              <div><span className="text-2xl font-bold text-white">1-click</span><br/>PDF + DOCX export</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-soft">
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-300">JD Match Score</div>
                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">87%</div>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-emerald-400 to-brand-500"></div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Strong skills</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">Python</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">SQL</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">React</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">AI</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Missing Keywords</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">LLM</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">RAG</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">Prompt Engineering</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-800 p-4">
                  <div className="text-xs text-slate-400">Suggested improvement</div>
                  <div className="mt-2 text-sm text-slate-200">
                    Add measurable impact and AI-focused technical ownership to your achievements.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
