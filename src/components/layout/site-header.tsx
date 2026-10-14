"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { IconBook2, IconHistory } from "@tabler/icons-react";
import { usePdfSession } from "@/features/reader/pdf-session-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const { clearSession } = usePdfSession();

  useEffect(() => {
    if (pathname !== "/read") clearSession();
  }, [pathname, clearSession]);

  const navClass = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-white/80 hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-xl text-[1.35rem] font-extrabold tracking-[-0.07em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="Folio home"
        >
          <span className="grid size-10 place-items-center rounded-xl border border-[#e4e5fb] bg-gradient-to-br from-white to-[#e9eaff] text-primary shadow-sm">
            <IconBook2 size={23} stroke={1.8} />
          </span>
          <span>
            folio<span className="text-primary">.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1.5" aria-label="Main navigation">
          <Link href="/read" className={navClass(pathname === "/read")}>
            Reader
          </Link>
          <Link href="/history" className={navClass(pathname === "/history")}>
            <IconHistory size={17} stroke={1.8} />
            <span className="hidden sm:inline">History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
