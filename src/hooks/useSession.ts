"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export type SessionState =
  | { status: "loading" }
  | { status: "noconfig" }
  | { status: "error" }
  | { status: "onboard"; hasAuthUser: boolean }
  | { status: "ready"; profile: Profile; userId: string };

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setState({ status: "noconfig" });
      return;
    }
    setState({ status: "loading" });
    try {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      // query พลาด (เน็ตสะดุด) → error ไม่ใช่ onboard กันสร้างบัญชีใหม่ทับบัญชีเดิม
      if (sessionError) throw new Error(sessionError.message);
      const session = sessionData.session;
      if (!session?.user) {
        setState({ status: "onboard", hasAuthUser: false });
        return;
      }
      const { data: profile, error: profileError } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);
      if (!profile) {
        setState({ status: "onboard", hasAuthUser: true });
        return;
      }
      setState({ status: "ready", profile: profile as Profile, userId: session.user.id });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const sb = getSupabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "onboard", hasAuthUser: false });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  return { state, refresh };
}
