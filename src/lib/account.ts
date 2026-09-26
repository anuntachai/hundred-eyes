import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import type { Locale } from "./i18n/provider";

export interface AccountInput {
  displayName: string;
  houseNumber: string | null;
  locale: Locale;
}

export type AccountResult = { ok: true } | { ok: false; nameTaken: boolean };

// ตรวจว่า error มาจาก unique index ของชื่อผู้ใช้ (23505 = unique_violation)
function isNameTaken(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code === "23505") return true;
  return (err?.message ?? "").includes("profiles_display_name_unique");
}

async function createAccountAttempt(sb: SupabaseClient, input: AccountInput): Promise<AccountResult> {
  try {
    const { data: sessionData } = await sb.auth.getSession();
    let userId = sessionData?.session?.user?.id;
    if (!userId) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data.user) return { ok: false, nameTaken: false };
      userId = data.user.id;
    }
    const { error } = await sb.from("profiles").upsert({
      id: userId,
      display_name: input.displayName,
      house_number: input.houseNumber,
      locale: input.locale,
    });
    if (error) return { ok: false, nameTaken: isNameTaken(error) };
    return { ok: true };
  } catch {
    return { ok: false, nameTaken: false };
  }
}

export async function createAccount(input: AccountInput): Promise<AccountResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, nameTaken: false };
  const first = await createAccountAttempt(sb, input);
  if (first.ok || first.nameTaken) return first;
  // self-heal: session ค้างของ user ที่ถูกลบไปจากระบบ (เช่นล้างข้อมูลทดสอบ)
  // → upsert ชน FK เสมอ → signOut ล้าง session ตายแล้วสร้างบัญชีใหม่
  try {
    await sb.auth.signOut();
  } catch {
    /* ignore */
  }
  return createAccountAttempt(sb, input);
}

export async function saveProfile(fields: {
  display_name?: string;
  house_number?: string | null;
  locale?: string;
}): Promise<AccountResult> {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, nameTaken: false };
    const { data: sessionData } = await sb.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return { ok: false, nameTaken: false };
    const { error } = await sb.from("profiles").update(fields).eq("id", userId);
    if (error) return { ok: false, nameTaken: isNameTaken(error) };
    return { ok: true };
  } catch {
    return { ok: false, nameTaken: false };
  }
}

export async function signOut(): Promise<void> {
  try {
    await getSupabase()?.auth.signOut();
  } catch {
    /* ignore */
  }
}
