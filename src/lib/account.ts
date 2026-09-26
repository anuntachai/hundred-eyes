import type { Provider, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import type { Locale } from "./i18n/provider";

// เริ่ม OAuth ด้วย LINE — redirect ออกจากหน้าไป LINE แล้วกลับมาที่หน้าแรกพร้อม session
export async function loginWithLine(): Promise<boolean> {
  try {
    const sb = getSupabase();
    if (!sb) return false;
    const { error } = await sb.auth.signInWithOAuth({
      // Supabase ไม่มี LINE แบบ built-in — ใช้ Custom OIDC provider ชื่อ custom:line
      // (ตั้งค่าที่ Dashboard → Authentication → Providers → New Provider)
      provider: "custom:line" as Provider,
      options: { redirectTo: window.location.origin + "/" },
    });
    return !error;
  } catch {
    return false;
  }
}

export interface ProfileInput {
  displayName: string;
  houseNumber: string | null;
  locale: Locale;
}

export type ProfileResult =
  | { ok: true }
  | { ok: false; nameTaken: boolean; sessionExpired?: boolean };

// ตรวจว่า error มาจาก unique index ของชื่อผู้ใช้ (23505 = unique_violation)
function isNameTaken(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code === "23505") return true;
  return (err?.message ?? "").includes("profiles_display_name_unique");
}

// บันทึกโปรไฟล์ของ user ที่ login ด้วย LINE แล้วเท่านั้น — เรียกเมื่อกด "สร้างบัญชี"
export async function createProfile(input: ProfileInput): Promise<ProfileResult> {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, nameTaken: false };
    const { data: sessionData } = await sb.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return { ok: false, nameTaken: false };
    const { error } = await sb.from("profiles").insert({
      id: userId,
      display_name: input.displayName,
      house_number: input.houseNumber,
      locale: input.locale,
    });
    if (error) {
      // 23503 = FK ไปหา auth.users ไม่เจอ → session ของ user ที่ถูกลบไปจากระบบ
      // ล้าง session ตายแล้วให้เข้าสู่ระบบใหม่ (self-heal)
      const err = error as { code?: string; message?: string };
      const sessionExpired = err.code === "23503" || (err.message ?? "").includes("violates foreign key");
      if (sessionExpired) {
        try {
          await sb.auth.signOut();
        } catch {
          /* ignore */
        }
        return { ok: false, nameTaken: false, sessionExpired: true };
      }
      return { ok: false, nameTaken: isNameTaken(error) };
    }
    return { ok: true };
  } catch {
    return { ok: false, nameTaken: false };
  }
}

export async function saveProfile(fields: {
  display_name?: string;
  house_number?: string | null;
  locale?: string;
}): Promise<ProfileResult> {
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

// บัญชี anonymous รุ่นเก่าถูกยกเลิก — ใช้สำหรับส่งออกจาก session เก่าใน useSession
export async function isAnonymousUser(client: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    if (!user) return false;
    return (user as { is_anonymous?: boolean }).is_anonymous === true;
  } catch {
    return false;
  }
}
