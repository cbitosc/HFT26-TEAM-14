"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/jobs", label: "Find jobs" },
  { href: "/prepare", label: "Prepare for a job" },
  { href: "/analyze", label: "Analyzer" },
  { href: "/builder", label: "Resume editor" },
  { href: "/settings", label: "Settings" },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="CareerFit AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-black text-white">C</span>
          <span>
            <span className="block text-base font-bold text-slate-900">CareerFit AI</span>
            <span className="block text-xs text-slate-500">Job fit + resume optimization</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
