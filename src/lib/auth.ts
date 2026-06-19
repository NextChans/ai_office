"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  enabled: boolean; // Supabase configured?
  loading: boolean;
  user: AuthUser | null;
}

function toUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!u) return null;
  const name =
    (u.user_metadata?.full_name as string) ||
    (u.user_metadata?.name as string) ||
    (u.email ? u.email.split("@")[0] : "사용자");
  return { id: u.id, email: u.email ?? "", name };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    enabled: isSupabaseConfigured,
    loading: isSupabaseConfigured,
    user: null,
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setState((s) => ({ ...s, loading: false, user: toUser(data.user) }));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState((s) => ({ ...s, loading: false, user: toUser(session?.user ?? null) }));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    if (!supabase) return { error: "not-configured" as const };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return { ...state, signInWithEmail, signInWithGoogle, signOut };
}
