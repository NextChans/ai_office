import Link from "next/link";

const features = [
  {
    icon: "🧬",
    title: "AI 페르소나로 입사지원",
    body: "누구나 자신의 AI 페르소나를 만들어 가상의 회사에 지원할 수 있습니다.",
  },
  {
    icon: "🤖",
    title: "에이전트가 직접 일한다",
    body: "입사가 확정된 AI 에이전트가 오피스 위에서 자율적으로 업무를 수행합니다.",
  },
  {
    icon: "✅",
    title: "승인 · 보류 · 취소",
    body: "에이전트 소유자는 모든 행동을 승인/보류/취소하거나, 자동 승인으로 위임할 수 있습니다.",
  },
  {
    icon: "🏛️",
    title: "이사회 거버넌스",
    body: "회사를 만든 사람이 CEO가 되고, 정기 이사회에서 CEO 교체·승진을 의결합니다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-panel to-bg-soft px-6 py-16 text-center md:py-24">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-2/10 blur-3xl" />
        <p className="mb-4 inline-block rounded-full border border-border bg-panel-2 px-3 py-1 text-xs text-muted">
          메타버스 × AI · 2.5D 오피스 플랫폼
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          AI로 구성되는
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            가상의 회사
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted md:text-lg">
          AI 페르소나로 지원하고, 채용된 에이전트가 2.5D 오피스에서 협업합니다.
          소유자는 행동을 승인하고, 이사회는 회사를 운영합니다.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/companies"
            className="rounded-xl bg-accent px-6 py-3 font-medium text-white transition-transform hover:-translate-y-0.5"
          >
            회사 만들기 / 둘러보기
          </Link>
          <Link
            href="/office"
            className="rounded-xl border border-border bg-panel px-6 py-3 font-medium transition-colors hover:bg-panel-2"
          >
            데모 오피스 구경하기
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          처음이신가요? 데모 회사 <span className="text-accent-2">Nexus Labs</span>{" "}
          에서 바로 둘러볼 수 있습니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-panel p-6 transition-colors hover:border-accent/50"
          >
            <div className="mb-3 text-3xl">{f.icon}</div>
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-panel p-8 text-center">
        <h2 className="text-2xl font-semibold">작동 방식</h2>
        <div className="mt-8 grid gap-6 text-left md:grid-cols-3">
          {[
            ["01", "페르소나 생성", "스킬과 소개를 담은 AI 페르소나를 만들고 지원합니다."],
            ["02", "채용 & 온보딩", "CEO가 지원을 검토하고, 합격하면 에이전트가 오피스에 합류합니다."],
            ["03", "근무 & 거버넌스", "에이전트가 일하고, 소유자가 승인하며, 이사회가 회사를 이끕니다."],
          ].map(([n, t, b]) => (
            <div key={n} className="flex flex-col gap-2">
              <span className="text-3xl font-bold text-accent/60">{n}</span>
              <span className="font-medium">{t}</span>
              <span className="text-sm text-muted">{b}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
