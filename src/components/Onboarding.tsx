"use client";

import { useState, type FormEvent } from "react";
import { createAccount } from "@/lib/account";
import { unlockAudio } from "@/lib/alarm";
import { useT } from "@/lib/i18n";
import { validateHouse, validateName } from "@/lib/validate";
import { EyeLogo } from "./EyeLogo";
import { LanguageToggle } from "./LanguageToggle";

export function Onboarding({ onDone }: { hasAuthUser?: boolean; onDone: () => void }) {
  const { t, locale } = useT();
  const [name, setName] = useState("");
  const [house, setHouse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const displayName = validateName(name);
    if (!displayName) {
      setError(t("error.nameRequired"));
      return;
    }
    const houseNumber = validateHouse(house);
    setError(null);
    setBusy(true);
    const ok = await createAccount({ displayName, houseNumber, locale });
    if (!ok) {
      setError(t("error.network"));
      setBusy(false);
      return;
    }
    // ใช้ gesture นี้ unlock AudioContext ให้ไซเรนทำงานได้ภายหลัง
    unlockAudio();
    onDone();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <EyeLogo size={96} />
          <h1 className="mt-3 text-2xl font-bold">Hundred Eyes</h1>
          <p className="mt-1 text-sm text-slate-500">{t("tagline")}</p>
          <p className="mt-3 text-sm text-slate-600">{t("onboarding.intro")}</p>
          <div className="mt-4">
            <LanguageToggle />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold">{t("onboarding.name")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("onboarding.namePlaceholder")}
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("onboarding.house")}</span>
            <input
              value={house}
              onChange={(event) => setHouse(event.target.value)}
              placeholder={t("onboarding.housePlaceholder")}
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 focus:border-primary focus:outline-none"
            />
            <span className="mt-1 block text-xs text-slate-500">{t("onboarding.houseHint")}</span>
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary py-3 font-bold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("onboarding.start")}
          </button>
        </form>
      </div>
    </main>
  );
}
