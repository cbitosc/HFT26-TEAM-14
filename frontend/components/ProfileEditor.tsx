"use client";

import type { EducationEntry, ExperienceEntry, Profile, ProjectEntry } from "@/lib/types";

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const labelClass = "block text-sm font-medium text-slate-700";
const secondaryButton = "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

type Props = { profile: Profile; onChange: (profile: Profile) => void };

export default function ProfileEditor({ profile, onChange }: Props) {
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value });
  const updateExperience = (index: number, patch: Partial<ExperienceEntry>) => update("experience", profile.experience.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateProject = (index: number, patch: Partial<ProjectEntry>) => update("projects", profile.projects.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateEducation = (index: number, patch: Partial<EducationEntry>) => update("education", profile.education.map((item, i) => i === index ? { ...item, ...patch } : item));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900">Personal details</h2>
        <p className="mt-1 text-sm text-slate-500">These details appear at the top of your resume.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Full name<input className={inputClass} value={profile.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" autoComplete="name" /></label>
          <label className={labelClass}>Professional title<input className={inputClass} value={profile.current_title} onChange={(e) => update("current_title", e.target.value)} placeholder="e.g. Software Engineer" /></label>
          <label className={labelClass}>Email<input className={inputClass} type="email" value={profile.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label className={labelClass}>Location<input className={inputClass} value={profile.location ?? ""} onChange={(e) => update("location", e.target.value)} placeholder="City, Country" autoComplete="address-level2" /></label>
          <label className={labelClass}>Years of experience<input className={inputClass} type="number" min="0" max="80" value={profile.years_experience} onChange={(e) => update("years_experience", Math.max(0, Number(e.target.value) || 0))} /></label>
          <label className={labelClass}>Career stage<select className={inputClass} value={profile.career_stage} onChange={(e) => update("career_stage", e.target.value as Profile["career_stage"])}><option value="student">Student · early years</option><option value="final_year">Final-year student</option><option value="fresher">Fresher / recent graduate</option><option value="early_career">Early-career professional</option><option value="experienced">Experienced professional</option></select><span className="mt-1 block text-xs font-normal text-slate-500">Used to set preparation urgency and plan pacing; it does not assume your ability.</span></label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900">Professional summary</h2>
        <label className={`${labelClass} mt-3`}>Summary<textarea className={`${inputClass} min-h-32 resize-y`} value={profile.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Write a short summary focused on your strengths and impact." /></label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900">Skills</h2>
        <label className={`${labelClass} mt-3`}>Separate skills with commas<textarea className={`${inputClass} min-h-24 resize-y`} value={profile.skills.join(", ")} onChange={(e) => update("skills", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Python, React, SQL" /></label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-lg font-bold text-slate-900">Work experience</h2><p className="text-sm text-slate-500">Add roles and one achievement per line.</p></div>
          <button type="button" className={secondaryButton} onClick={() => update("experience", [...profile.experience, { company: "", role: "", duration: "", bullets: [] }])}>+ Add experience</button>
        </div>
        <div className="mt-4 space-y-4">
          {profile.experience.map((item, index) => (
            <div key={`experience-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex justify-end"><button type="button" className="text-sm font-medium text-red-600 hover:text-red-800" onClick={() => update("experience", profile.experience.filter((_, i) => i !== index))}>Remove</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Role<input className={inputClass} value={item.role} onChange={(e) => updateExperience(index, { role: e.target.value })} placeholder="Role" /></label>
                <label className={labelClass}>Company<input className={inputClass} value={item.company} onChange={(e) => updateExperience(index, { company: e.target.value })} placeholder="Company" /></label>
                <label className={`${labelClass} sm:col-span-2`}>Dates<input className={inputClass} value={item.duration} onChange={(e) => updateExperience(index, { duration: e.target.value })} placeholder="2022 – Present" /></label>
                <label className={`${labelClass} sm:col-span-2`}>Achievements, one per line<textarea className={`${inputClass} min-h-24`} value={item.bullets.join("\n")} onChange={(e) => updateExperience(index, { bullets: e.target.value.split("\n") })} placeholder="Describe your work and impact" /></label>
              </div>
            </div>
          ))}
          {profile.experience.length === 0 && <p className="text-sm text-slate-500">No experience added yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-lg font-bold text-slate-900">Projects</h2><p className="text-sm text-slate-500">Include relevant personal or professional projects.</p></div>
          <button type="button" className={secondaryButton} onClick={() => update("projects", [...profile.projects, { name: "", description: "", tech_stack: [], impact: "" }])}>+ Add project</button>
        </div>
        <div className="mt-4 space-y-4">
          {profile.projects.map((item, index) => (
            <div key={`project-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex justify-end"><button type="button" className="text-sm font-medium text-red-600 hover:text-red-800" onClick={() => update("projects", profile.projects.filter((_, i) => i !== index))}>Remove</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Project name<input className={inputClass} value={item.name} onChange={(e) => updateProject(index, { name: e.target.value })} /></label>
                <label className={labelClass}>Technologies<input className={inputClass} value={item.tech_stack.join(", ")} onChange={(e) => updateProject(index, { tech_stack: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="TypeScript, PostgreSQL" /></label>
                <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${inputClass} min-h-20`} value={item.description} onChange={(e) => updateProject(index, { description: e.target.value })} /></label>
                <label className={`${labelClass} sm:col-span-2`}>Impact<input className={inputClass} value={item.impact} onChange={(e) => updateProject(index, { impact: e.target.value })} placeholder="Outcome or result" /></label>
              </div>
            </div>
          ))}
          {profile.projects.length === 0 && <p className="text-sm text-slate-500">No projects added yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-lg font-bold text-slate-900">Education</h2><p className="text-sm text-slate-500">Add degrees, institutions, and dates.</p></div>
          <button type="button" className={secondaryButton} onClick={() => update("education", [...profile.education, { degree: "", institution: "", year: "" }])}>+ Add education</button>
        </div>
        <div className="mt-4 space-y-3">
          {profile.education.map((item, index) => (
            <div key={`education-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <label className={labelClass}>Degree<input className={inputClass} value={item.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} /></label>
              <label className={labelClass}>Institution<input className={inputClass} value={item.institution} onChange={(e) => updateEducation(index, { institution: e.target.value })} /></label>
              <label className={labelClass}>Year<input className={inputClass} value={item.year} onChange={(e) => updateEducation(index, { year: e.target.value })} /></label>
              <button type="button" className="text-left text-sm font-medium text-red-600 hover:text-red-800 sm:col-span-3" onClick={() => update("education", profile.education.filter((_, i) => i !== index))}>Remove education</button>
            </div>
          ))}
          {profile.education.length === 0 && <p className="text-sm text-slate-500">No education added yet.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-slate-900">Certifications</h2>
        <label className={`${labelClass} mt-3`}>One certification per line<textarea className={`${inputClass} min-h-24`} value={profile.certifications.join("\n")} onChange={(e) => update("certifications", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} placeholder="Certification name" /></label>
      </section>
    </div>
  );
}
