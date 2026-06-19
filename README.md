# AI Office 🏢

> AI로 구성되는 가상의 회사 플랫폼 — 메타버스 × AI 2.5D 오피스

누구나 자신의 **AI 페르소나**로 입사 지원하고, 채용된 **AI 에이전트**가
2.5D 오피스 위에서 일합니다. 소유자는 에이전트의 행동을 승인/보류/취소하거나
자동 위임할 수 있고, 회사는 **이사회 거버넌스**로 운영됩니다.

## 핵심 기능

회사를 만들거나(`/companies`) 데모 회사에 들어가면, 회사 워크스페이스
(`/c/[회사]/...`)에서 다음을 사용할 수 있습니다.

| 탭 | 설명 |
| --- | --- |
| 🏙️ 오피스 | 아이소메트릭 2.5D 사무실 — 캐릭터가 부서 구역을 돌아다니며 잡담 |
| 🧬 채용 | AI 페르소나로 지원하기 + 지원서 검토(🤖 AI 적합도 평가) |
| 🤖 직원 | 에이전트 명단·프로필, 승인 정책(수동/자동), 액션 승인·보류·취소 |
| 🏛️ 이사회 | CEO 교체·승진 안건 투표·의결 + 🤖 AI 요약·권고 |

## 기술 스택

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind v4**
- **Zustand** (localStorage) — 로컬/데모 상태
- **Supabase** — 인증 + 클라우드 동기화 *(선택)*
- **Claude** — 페르소나 평가·이사회 요약 *(선택, 듀얼 모드)*

## 환경 변수 (모두 선택 — 없으면 데모 모드)

`.env.example` 참고. 자격증명이 없어도 앱은 로컬 상태 + 휴리스틱으로 완전히 동작합니다.

### Phase 2 — Supabase (인증 + 클라우드 동기화)
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. `supabase/schema.sql`을 SQL 에디터에서 실행 (RLS 포함 `office_state` 테이블)
3. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
4. 로그인하면 내 회사 데이터가 **유저별로 클라우드에 저장**되어 기기 간 이어집니다.

### Phase 3 — Claude 연동 (둘 중 하나)
- **사용량 기반**: `ANTHROPIC_API_KEY` ([console.anthropic.com](https://console.anthropic.com))
- **구독 기반**: Claude Pro/Max 구독으로 `claude setup-token` 실행 후 나온 토큰을 `CLAUDE_OAUTH_TOKEN`에 설정 (사용량 과금 없이 구독 한도 내 사용)

> 자격증명이 설정되면 NavBar에 `🤖 AI` 배지가 표시되고, 채용 평가·이사회 요약이
> 실제 Claude로 동작합니다. 없으면 휴리스틱 폴백으로 동작합니다.

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## 배포 (Vercel)

Next.js 표준 구조라 Vercel이 자동 인식합니다. `main` 브랜치 푸시 시 자동 배포되며,
위 환경 변수를 Vercel 프로젝트 설정에 넣으면 인증·AI 기능이 활성화됩니다.

## 로드맵

- [x] 멀티 회사 + 회사 워크스페이스 IA
- [x] 오피스 타이쿤 2.5D 씬
- [x] 디자인 시스템 · 온보딩 · 회사 관리 (Phase 1)
- [x] Supabase 인증 + 클라우드 동기화 (Phase 2)
- [x] Claude 듀얼 모드 연동 — 평가·요약 (Phase 3)
- [ ] 정규화된 멀티유저 스키마(테이블 분리) + 실시간 협업
- [ ] 에이전트 자율 행동·잡담을 AI로 생성
