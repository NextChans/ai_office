"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Modal, TextInput } from "@/components/ui";
import { toast } from "@/components/ui/toast";

export function AuthButton() {
  const { enabled, loading, user, signInWithEmail, signInWithGoogle, signOut } =
    useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // Demo mode (no Supabase configured): show a subtle badge, no auth.
  if (!enabled) {
    return (
      <span
        className="hidden rounded-full border border-border bg-panel-2 px-2.5 py-1 text-xs text-muted sm:inline"
        title="로그인 비활성 — Supabase 미설정 (데모 모드)"
      >
        데모 모드
      </span>
    );
  }

  if (loading) {
    return <span className="text-xs text-muted">…</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden max-w-[120px] truncate text-xs text-muted sm:inline"
          title={user.email}
        >
          {user.name}
        </span>
        <button
          onClick={() => {
            signOut();
            toast.info("로그아웃되었습니다.");
          }}
          className="rounded-lg border border-border bg-panel-2 px-2.5 py-1 text-xs text-muted hover:text-text focus-ring"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white focus-ring"
      >
        로그인
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="로그인 / 가입">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            로그인하면 내 회사가 클라우드에 저장되어 어느 기기에서나 이어집니다.
          </p>
          <Button variant="secondary" onClick={signInWithGoogle}>
            Google로 계속하기
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            또는 이메일
            <span className="h-px flex-1 bg-border" />
          </div>
          {sent ? (
            <p className="rounded-lg border border-accent-2/40 bg-accent-2/10 p-3 text-sm text-accent-2">
              ✉️ {email} 으로 로그인 링크를 보냈습니다. 메일을 확인하세요.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button
                onClick={async () => {
                  if (!email) return;
                  const { error } = await signInWithEmail(email);
                  if (error) toast.error("전송 실패: " + error);
                  else setSent(true);
                }}
              >
                매직 링크 보내기
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
