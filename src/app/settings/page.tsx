"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { FloodWatch } from "@/components/FloodWatch";
import { InstallButton } from "@/components/InstallButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Onboarding } from "@/components/Onboarding";
import { useToast } from "@/components/Toast";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePushPermission } from "@/hooks/usePushPermission";
import { useSession } from "@/hooks/useSession";
import { saveProfile, signOut } from "@/lib/account";
import { playFloodAlarm, unlockAudio } from "@/lib/alarm";
import { useT } from "@/lib/i18n";
import { validateHouse, validateName } from "@/lib/validate";

const cardClass = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 p-3 focus:border-primary focus:outline-none";

export default function SettingsPage() {
  const { state, refresh } = useSession();
  const { t, locale } = useT();
  const { showToast } = useToast();
  const { permission, enable, heal } = usePushPermission();
  const { canInstall, isIOS, standalone } = useInstallPrompt();
  const [name, setName] = useState("");
  const [house, setHouse] = useState("");
  const [saving, setSaving] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const ready = state.status === "ready";
  const profile = ready ? state.profile : null;

  useEffect(() => {
    if (profile) {
      setName(profile.display_name);
      setHouse(profile.house_number ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (ready) void heal(locale);
  }, [ready, heal, locale]);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          role="status"
          aria-label="loading"
          className="inline-block size-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary"
        />
      </main>
    );
  }

  if (state.status === "noconfig") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-bold">{t("setup.title")}</h1>
        <p className="text-sm text-slate-500">{t("setup.body")}</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-danger">{t("error.network")}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover"
        >
          {t("home.loadMore")}
        </button>
      </main>
    );
  }

  if (state.status === "onboard") {
    return <Onboarding hasAuthUser={state.hasAuthUser} onDone={() => void refresh()} />;
  }

  async function handleSave() {
    const displayName = validateName(name);
    if (!displayName) {
      showToast(t("error.nameRequired"), "error");
      return;
    }
    const houseNumber = validateHouse(house);
    setSaving(true);
    const ok = await saveProfile({ display_name: displayName, house_number: houseNumber, locale });
    setSaving(false);
    showToast(ok ? t("settings.saved") : t("error.network"), ok ? "success" : "error");
    if (ok) void refresh();
  }

  async function handleEnableNotifications() {
    setEnabling(true);
    const result = await enable(locale);
    setEnabling(false);
    if (result === "error") showToast(t("error.network"), "error");
  }

  function handleLogout() {
    if (!window.confirm(t("settings.logoutConfirm"))) return;
    void signOut();
  }

  return (
    <>
      <AppHeader />
      <FloodWatch userId={state.userId} />
      <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <h1 className="mb-3 text-xl font-bold">{t("settings.title")}</h1>
        <div className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
            className={cardClass}
          >
            <h2 className="font-semibold">{t("onboarding.name")}</h2>
            <label className="mt-2 block">
              <span className="text-sm font-semibold">{t("onboarding.name")}</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-semibold">{t("onboarding.house")}</span>
              <input
                value={house}
                onChange={(event) => setHouse(event.target.value)}
                placeholder={t("onboarding.housePlaceholder")}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {t("settings.save")}
            </button>
          </form>

          <section className={cardClass}>
            <h2 className="font-semibold">{t("settings.language")}</h2>
            <div className="mt-2">
              <LanguageToggle
                onLocaleChange={(next) => {
                  void saveProfile({ locale: next });
                }}
              />
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="font-semibold">{t("notif.heading")}</h2>
            <div className="mt-2 text-sm text-slate-600">
              {permission === "granted" && <p>{t("notif.enabled")}</p>}
              {permission === "denied" && <p>{t("notif.blocked")}</p>}
              {permission === "unsupported" && isIOS && <p>{t("notif.iosHint")}</p>}
              {permission === "default" && (
                <>
                  {isIOS && !standalone && <p className="mb-2">{t("notif.iosHint")}</p>}
                  <button
                    type="button"
                    onClick={() => void handleEnableNotifications()}
                    disabled={enabling}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    {t("notif.enable")}
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                playFloodAlarm();
              }}
              className="mt-3 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              {t("notif.testSound")}
            </button>
          </section>

          <section className={cardClass}>
            <h2 className="font-semibold">{t("install.install")}</h2>
            <div className="mt-2">
              {canInstall ? (
                <InstallButton className="px-6 py-3 text-base" />
              ) : isIOS && !standalone ? (
                <p className="text-sm text-slate-600">{t("install.iosHint")}</p>
              ) : (
                <p className="text-sm text-slate-400">{t("notif.enabled")}</p>
              )}
            </div>
          </section>

          <section className={cardClass}>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-full border border-danger py-3 font-semibold text-danger hover:bg-danger-bg"
            >
              {t("settings.logout")}
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
