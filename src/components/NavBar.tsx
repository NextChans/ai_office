"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOffice, useCurrentCompany } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

const links = [
  { href: "/", label: "홈" },
  { href: "/companies", label: "회사" },
];

export function NavBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const company = useCurrentCompany();
  const currentCompanyId = useOffice((s) => s.currentCompanyId);
  const inWorkspace = pathname.startsWith("/c/");

  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🏢</span>
            <span>
              AI<span className="text-accent">Office</span>
            </span>
          </Link>
          {hydrated && company && (
            <Link
              href={`/c/${currentCompanyId}/office`}
              className={`hidden items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors sm:flex ${
                inWorkspace
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border bg-panel-2 text-muted hover:text-text"
              }`}
              title="현재 회사 오피스로"
            >
              <span className="text-accent-2">●</span>
              {company.name}
            </Link>
          )}
        </div>
        <ul className="flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:bg-panel-2 hover:text-text"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
