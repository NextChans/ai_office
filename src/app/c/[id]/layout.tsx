"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useOffice } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { Button, Modal, TextInput } from "@/components/ui";
import { toast } from "@/components/ui/toast";

const TABS = [
  { seg: "office", label: "오피스", icon: "🏙️" },
  { seg: "hiring", label: "채용", icon: "🧬" },
  { seg: "employees", label: "직원", icon: "🤖" },
  { seg: "board", label: "이사회", icon: "🏛️" },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const hydrated = useHydrated();

  const companies = useOffice((s) => s.companies);
  const agents = useOffice((s) => s.agents);
  const actions = useOffice((s) => s.actions);
  const proposals = useOffice((s) => s.proposals);
  const setCurrentCompany = useOffice((s) => s.setCurrentCompany);

  const company = companies.find((c) => c.id === id);

  // Keep the store's current company in sync with the URL (for OfficeFloor etc).
  useEffect(() => {
    if (company) setCurrentCompany(company.id);
  }, [company, setCurrentCompany]);

  if (!hydrated) {
    return <div className="py-20 text-center text-muted">불러오는 중…</div>;
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-panel p-10 text-center">
        <div className="mb-3 text-4xl">🏚️</div>
        <h1 className="font-semibold">회사를 찾을 수 없습니다</h1>
        <p className="mt-1 text-sm text-muted">
          삭제되었거나 잘못된 주소일 수 있어요.
        </p>
        <Link
          href="/companies"
          className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          회사 목록으로
        </Link>
      </div>
    );
  }

  const ceo = agents.find((a) => a.id === company.ceoAgentId);
  const empCount = agents.filter((a) => a.companyId === company.id).length;
  const pendingActions = actions.filter(
    (a) => a.companyId === company.id && a.status === "proposed"
  ).length;
  const openProposals = proposals.filter(
    (p) => p.companyId === company.id && !p.resolved
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Workspace header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-panel to-bg-soft p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{company.name}</h1>
              {company.isDemo && (
                <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                  데모
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">{company.mission}</p>
            <p className="mt-1 text-xs text-muted">
              {company.industry && <>🏷️ {company.industry} · </>}
              👑 {ceo ? ceo.name : "공석"} · 설립자 {company.ownerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CompanySettings companyId={company.id} />
            <Link
              href="/companies"
              className="rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-xs text-muted transition-colors hover:text-text focus-ring"
            >
              ← 회사 나가기
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Metric label="직원" value={empCount} />
          <Metric label="대기 액션" value={pendingActions} accent={pendingActions > 0} />
          <Metric label="진행 안건" value={openProposals} accent={openProposals > 0} />
        </div>
      </div>

      {/* Workspace tabs */}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-panel p-1 text-sm">
        {TABS.map((t) => {
          const href = `/c/${id}/${t.seg}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={t.seg}
              href={href}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
                active
                  ? "bg-accent/20 text-accent"
                  : "text-muted hover:bg-panel-2 hover:text-text"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

function CompanySettings({ companyId }: { companyId: string }) {
  const router = useRouter();
  const companies = useOffice((s) => s.companies);
  const updateCompany = useOffice((s) => s.updateCompany);
  const deleteCompany = useOffice((s) => s.deleteCompany);
  const company = companies.find((c) => c.id === companyId);

  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [industry, setIndustry] = useState("");

  const openModal = () => {
    if (!company) return;
    setName(company.name);
    setMission(company.mission);
    setIndustry(company.industry ?? "");
    setConfirmDelete(false);
    setOpen(true);
  };

  if (!company) return null;

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg border border-border bg-panel-2 px-3 py-1.5 text-xs text-muted transition-colors hover:text-text focus-ring"
        title="회사 설정"
      >
        ⚙️ 설정
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="회사 설정">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">회사명</span>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">산업 분야</span>
            <TextInput
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">미션</span>
            <TextInput
              value={mission}
              onChange={(e) => setMission(e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                updateCompany(companyId, {
                  name: name.trim() || company.name,
                  mission: mission.trim(),
                  industry: industry.trim(),
                });
                toast.success("회사 정보를 저장했습니다.");
                setOpen(false);
              }}
            >
              저장
            </Button>
          </div>

          <div className="mt-2 border-t border-border pt-4">
            {company.isDemo ? (
              <p className="text-xs text-muted">
                데모 회사는 삭제할 수 없습니다. 직접 만든 회사는 삭제할 수 있어요.
              </p>
            ) : !confirmDelete ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                회사 삭제
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-danger">
                  정말 삭제할까요? 직원·이사회 기록이 모두 사라집니다.
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteCompany(companyId);
                      toast.info("회사를 삭제했습니다.");
                      router.push("/companies");
                    }}
                  >
                    삭제 확정
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <span
      className={`rounded-lg border px-3 py-1.5 ${
        accent
          ? "border-warn/40 bg-warn/10 text-warn"
          : "border-border bg-panel"
      }`}
    >
      <span className="font-bold">{value}</span>{" "}
      <span className="text-muted">{label}</span>
    </span>
  );
}
