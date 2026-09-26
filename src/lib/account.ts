import { getSupabase } from "./supabase/client";
import type { Locale } from "./i18n/provider";

export async function createAccount(input: {
  displayName: string;
  houseNumber: string | null;
  locale: Locale;
}): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (!sb) return false;
    const { data: sessionData } = await sb.auth.getSession();
    let userId = sessionData?.session?.user?.id;
    if (!userId) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data.user) return false;
      userId = data.user.id;
    }
    const { error } = await sb.from("profiles").upsert({
      id: userId,
      display_name: input.displayName,
      house_number: input.houseNumber,
      locale: input.locale,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function saveProfile(fields: {
  display_name?: string;
  house_number?: string | null;
  locale?: string;
}): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (!sb) return false;
    const { data: sessionData } = await sb.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return false;
    const { error } = await sb.from("profiles").update(fields).eq("id", userId);
    return !error;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  try {
    await getSupabase()?.auth.signOut();
  } catch {
    /* ignore */
  }
}
