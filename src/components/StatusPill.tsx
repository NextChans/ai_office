export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    proposed: "bg-warn/20 text-warn",
    approved: "bg-accent-2/20 text-accent-2",
    held: "bg-muted/20 text-muted",
    cancelled: "bg-danger/20 text-danger",
    done: "bg-accent/20 text-accent",
  };
  const label: Record<string, string> = {
    proposed: "대기",
    approved: "승인됨",
    held: "보류",
    cancelled: "취소됨",
    done: "완료",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}
