"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useOffice } from "@/lib/store";

const SLICE_KEYS = [
  "companies",
  "currentCompanyId",
  "personas",
  "applications",
  "agents",
  "actions",
  "meetings",
  "proposals",
] as const;

type Snapshot = Record<string, unknown>;

function snapshot(): Snapshot {
  const s = useOffice.getState() as unknown as Record<string, unknown>;
  const out: Snapshot = {};
  for (const k of SLICE_KEYS) out[k] = s[k];
  return out;
}

/**
 * When Supabase is configured AND a user is signed in, this mirrors the local
 * office state to a per-user JSONB row (`office_state`) and hydrates from it on
 * load — giving cross-device persistence and per-user data. No-op otherwise.
 */
export function CloudSync() {
  const { user } = useAuth();
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase || !user) {
      ready.current = false;
      return;
    }
    let active = true;

    (async () => {
      const { data } = await supabase!
        .from("office_state")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (data?.data) {
        // Hydrate store with the user's saved slices (merge, keep actions).
        useOffice.setState(data.data as object);
      } else {
        // First sign-in: seed cloud with current local state.
        await supabase!
          .from("office_state")
          .upsert({ user_id: user.id, data: snapshot() });
      }
      ready.current = true;
    })();

    const unsub = useOffice.subscribe(() => {
      if (!ready.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        supabase!
          .from("office_state")
          .upsert({ user_id: user.id, data: snapshot() })
          .then(() => {});
      }, 800);
    });

    return () => {
      active = false;
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user]);

  return null;
}
