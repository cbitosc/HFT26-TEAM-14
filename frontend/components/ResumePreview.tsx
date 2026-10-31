import type { Profile } from "@/lib/types";

export default function ResumePreview({ profile }: { profile: Profile }) {
  const contact = [profile.email, profile.location].filter(Boolean).join(" | ");
  return (
    <article className="resume-paper mx-auto min-h-[700px] max-w-3xl bg-white p-8 text-slate-800 shadow-lg sm:p-12">
      <header className="border-b-2 border-slate-800 pb-5 text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">{profile.name || "Your Name"}</h1>
        {profile.current_title && <p className="mt-2 text-lg font-medium">{profile.current_title}</p>}
        {contact && <p className="mt-2 text-sm text-slate-600">{contact}</p>}
      </header>

      {profile.summary && <section className="mt-6"><h2 className="resume-heading">Professional Summary</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{profile.summary}</p></section>}
      {profile.skills.length > 0 && <section className="mt-6"><h2 className="resume-heading">Skills</h2><p className="mt-2 text-sm leading-6">{profile.skills.join(" | ")}</p></section>}

      {profile.experience.length > 0 && <section className="mt-6"><h2 className="resume-heading">Experience</h2><div className="mt-3 space-y-4">
        {profile.experience.map((item, index) => <div key={`preview-experience-${index}`}>
          <div className="flex flex-wrap justify-between gap-x-4"><strong>{item.role}</strong><span className="text-sm text-slate-600">{item.duration}</span></div>
          <p className="text-sm text-slate-600">{item.company}</p>
          {item.bullets.some(Boolean) && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5">{item.bullets.filter(Boolean).map((bullet, i) => <li key={`bullet-${i}`}>{bullet}</li>)}</ul>}
        </div>)}
      </div></section>}

      {profile.projects.length > 0 && <section className="mt-6"><h2 className="resume-heading">Projects</h2><div className="mt-3 space-y-3">
        {profile.projects.map((item, index) => <div key={`preview-project-${index}`}><strong>{item.name}</strong>{item.tech_stack.length > 0 && <span className="ml-2 text-sm text-slate-600">{item.tech_stack.join(", ")}</span>}{item.description && <p className="mt-1 text-sm leading-5">{item.description}</p>}{item.impact && <p className="mt-1 text-sm leading-5">Impact: {item.impact}</p>}</div>)}
      </div></section>}

      {profile.education.length > 0 && <section className="mt-6"><h2 className="resume-heading">Education</h2><div className="mt-3 space-y-2">
        {profile.education.map((item, index) => <div key={`preview-education-${index}`} className="flex flex-wrap justify-between gap-x-4 text-sm"><span><strong>{item.degree}</strong>{item.institution ? ` | ${item.institution}` : ""}</span><span className="text-slate-600">{item.year}</span></div>)}
      </div></section>}

      {profile.certifications.length > 0 && <section className="mt-6"><h2 className="resume-heading">Certifications</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{profile.certifications.map((item, index) => <li key={`preview-certification-${index}`}>{item}</li>)}</ul></section>}
    </article>
  );
}
