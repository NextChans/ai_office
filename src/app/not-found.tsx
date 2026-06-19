import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border bg-panel px-6 py-16 text-center">
      <div className="mb-4 text-5xl">🛰️</div>
      <h1 className="text-2xl font-bold">길을 잃었어요</h1>
      <p className="mt-2 text-sm text-muted">
        존재하지 않는 페이지입니다. 회사 목록에서 다시 시작해 보세요.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-xl border border-border bg-panel-2 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-panel"
        >
          홈으로
        </Link>
        <Link
          href="/companies"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          회사 둘러보기
        </Link>
      </div>
    </div>
  );
}
