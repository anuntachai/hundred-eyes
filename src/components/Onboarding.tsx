"use client";

import { useState, type FormEvent } from "react";
import { createProfile, loginWithLine } from "@/lib/account";
import { unlockAudio } from "@/lib/alarm";
import { useT } from "@/lib/i18n";
import { validateHouse, validateName } from "@/lib/validate";
import { EyeLogo } from "./EyeLogo";
import { LanguageToggle } from "./LanguageToggle";

// Onboarding สองโหมด:
// - ยังไม่มี session → ปุ่ม "เข้าสู่ระบบด้วย LINE"
// - login แล้วแต่ยังไม่มี profile (ครั้งแรก) → ฟอร์มกรอกชื่อ/บ้านเลขที่ กด "สร้างบัญชี" จึงบันทึก DB
export function Onboarding({ hasAuthUser, onDone }: { hasAuthUser?: boolean; onDone: () => void }) {
  const { t, locale } = useT();
  const [name, setName] = useState("");
  const [house, setHouse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // session ของ user ที่ถูกลบจากระบบ → สลับกลับโหมดปุ่ม LINE พร้อมข้อความอธิบาย
  const [sessionExpired, setSessionExpired] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
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
    const result = await createProfile({ displayName, houseNumber, locale });
    setBusy(false);
    if (!result.ok) {
      if (result.sessionExpired) {
        setSessionExpired(true);
        return;
      }
      setError(result.nameTaken ? t("error.nameTaken") : t("error.network"));
      return;
    }
    // ใช้ gesture นี้ unlock AudioContext ให้ไซเรนทำงานได้ภายหลัง
    unlockAudio();
    onDone();
  }

  const header = (
    <div className="flex flex-col items-center text-center">
      <EyeLogo size={96} />
      <h1 className="mt-3 text-2xl font-bold">Hundred Eyes</h1>
      <p className="mt-1 text-sm text-slate-500">{t("tagline")}</p>
      <p className="mt-3 text-sm text-slate-600">{t("onboarding.intro")}</p>
      <div className="mt-4">
        <LanguageToggle />
      </div>
    </div>
  );

  // โหมด 1: ยังไม่ login (หรือ session ตายถูกล้างแล้ว) → ปุ่ม LINE
  if (!hasAuthUser || sessionExpired) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {header}
          {sessionExpired && (
            <p role="alert" className="mt-4 text-center text-sm font-medium text-danger">
              {t("error.sessionExpired")}
            </p>
          )}
          <button
            type="button"
            onClick={() => void loginWithLine()}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#06C755] py-3.5 font-bold text-white hover:brightness-95"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5c-5.24 0-9.5 3.46-9.5 7.74 0 3.83 3.4 7.04 7.99 7.64.31.07.74.2.84.46.1.24.06.6.03.84l-.13.82c-.04.24-.19.94.82.51 1.02-.43 5.48-3.23 7.47-5.53 1.38-1.51 1.98-3.05 1.98-4.74 0-4.28-4.26-7.74-9.5-7.74z" />
            </svg>
            {t("onboarding.lineLogin")}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">{t("onboarding.lineHint")}</p>
        </div>
      </main>
    );
  }

  // โหมด 2: login ด้วย LINE แล้ว แต่ยังไม่มี profile → ฟอร์มสร้างบัญชี
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <EyeLogo size={64} />
          <h1 className="mt-3 text-xl font-bold">{t("onboarding.createTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("onboarding.createHint")}</p>
        </div>
        <form onSubmit={handleCreate} className="mt-6 space-y-3">
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
            {t("onboarding.create")}
          </button>
        </form>
      </div>
    </main>
  );
}
