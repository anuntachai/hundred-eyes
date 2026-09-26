"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./en";
import { th } from "./th";
import type { DictKey } from "./th";
import { LOCALE_STORAGE_KEY } from "../constants";

export type Locale = "th" | "en";

const dictionaries: Record<Locale, Record<DictKey, string>> = { th, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // เริ่ม "th" เสมอใน render แรก → SSR/CSR hydration ตรงกัน แล้วค่อย sync จาก localStorage
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "th" || stored === "en") {
        setLocaleState(stored);
        return;
      }
      setLocaleState(navigator.language.toLowerCase().startsWith("th") ? "th" : "en");
    } catch {
      /* localStorage ไม่ใช้ได้ → คงเป็น th */
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: DictKey) => dictionaries[locale][key] ?? key, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
