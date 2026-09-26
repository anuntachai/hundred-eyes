"use client";

import Link from "next/link";
import { EyeLogo } from "./EyeLogo";
import { InstallButton } from "./InstallButton";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "@/lib/i18n";

export function AppHeader() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        <EyeLogo size={32} />
        <span className="text-lg font-bold">Hundred Eyes</span>
        <div className="ml-auto flex items-center gap-2">
          <InstallButton />
          <LanguageToggle />
          <Link
            href="/settings"
            aria-label={t("settings.title")}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <Link
            href="/report"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover sm:inline-flex"
          >
            {t("home.reportCta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
