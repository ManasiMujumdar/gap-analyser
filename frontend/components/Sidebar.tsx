"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared navigation (task 8.1) - carries the current analysis ID across
 * links, matching the Stitch sidebar design. Only links to screens that
 * actually exist are shown (Stitch's mockup included placeholder
 * Coaching/Support/Settings links with href="#" - dropped rather than
 * shipped as dead links).
 */
export function Sidebar({ analysisId }: { analysisId?: string }) {
  const pathname = usePathname();

  const links = [
    { href: analysisId ? `/dashboard/${analysisId}` : "/start", label: "Gap Report", icon: "analytics" },
    { href: analysisId ? `/start/${analysisId}` : "/start", label: "Upload Resume", icon: "upload_file" },
    { href: analysisId ? `/timeline/${analysisId}` : "/start", label: "Timeline", icon: "history" },
  ];

  return (
    <nav className="hidden lg:flex flex-col h-screen p-gutter fixed left-0 w-64 border-r border-border-soft bg-surface z-40">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary-fixed-dim flex items-center justify-center text-primary font-bold">
          GC
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Gap Check</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Career Growth Partner</p>
        </div>
      </div>
      <Link
        href="/start"
        className="w-full py-2 px-4 bg-secondary text-on-primary rounded-lg font-label-md text-label-md mb-8 text-center hover:bg-secondary-container transition-colors"
      >
        New Analysis
      </Link>
      <ul className="flex-1 space-y-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href.split("/").slice(0, 2).join("/"));
          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md transition-all ${
                  active ? "text-primary font-bold bg-bg-subtle" : "text-on-surface-variant hover:bg-bg-subtle"
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
