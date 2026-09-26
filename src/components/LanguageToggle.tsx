"use client";

import { useT, type Locale } from "@/lib/i18n";

export function LanguageToggle({ onLocaleChange }: { onLocaleChange?: (locale: Locale) => void }) {
  const { locale, setLocale } = useT();

  function select(next: Locale) {
    setLocale(next);
    onLocaleChange?.(next);
  }

  const base =
    "px-3 py-1.5 transition-colors";
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex overflow-hidden rounded-full border border-slate-200 text-xs font-semibold"
    >
      <button
        type="button"
        onClick={() => select("th")}
        aria-pressed={locale === "th"}
        className={`${base} ${locale === "th" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => select("en")}
        aria-pressed={locale === "en"}
        className={`${base} ${locale === "en" ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        EN
      </button>
    </div>
  );
}
