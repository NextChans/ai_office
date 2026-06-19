"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "홈" },
  { href: "/office", label: "오피스" },
  { href: "/apply", label: "입사지원" },
  { href: "/agents", label: "에이전트" },
  { href: "/board", label: "이사회" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🏢</span>
          <span>
            AI<span className="text-accent">Office</span>
          </span>
        </Link>
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
