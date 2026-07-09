# ownly — Claude 작업 가이드

이 문서는 Claude 같은 AI 에이전트가 ownly 코드베이스에서 작업할 때 즉시 알아야 할 컨벤션·환경변수·디자인 시스템·운영 체크리스트를 정리합니다. **항상 한국어 존댓말로 응답합니다.**

---

## 1. 스택 한눈에

- **Next.js 16** (App Router) + **React 19**
- **Supabase** (Postgres + Auth + Storage + Realtime)
- **Tailwind 4** + 커스텀 디자인 시스템 (`src/app/globals.css`)
- **Recharts** 차트, **lucide-react** 아이콘, **framer-motion** 일부
- **외부 API**: 국토부 실거래(MOLIT), Resend(이메일), Solapi(카카오 알림톡), Toss Payments(백엔드만, 카카오페이 PG 심사 중)

## 2. 디렉토리 핵심

```
src/
  app/                  Next App Router 라우트
    api/                서버 라우트 (molit, kakao, notify, billing 등)
    dashboard/          로그인 후 임대인 화면
    portal/[tenantId]/  로그인 없이 세입자가 보는 포털
    request/[tenantId]/ 세입자 수리 요청 페이지
    sise/, diagnose/    공개 SEO 페이지
  components/           공유 컴포넌트 (위젯·shared UI·네비)
  context/              AppContext (전역 상태·Supabase 데이터)
  lib/                  도메인 로직 (holdingTax, paymentRisk, regions 등)
supabase/migrations/    스키마·RLS·트리거 SQL
```

## 3. 디자인 시스템 (2026)

`src/app/globals.css`에 토큰·유틸 클래스가 정의되어 있습니다. **새 페이지/컴포넌트는 가능한 한 이 클래스를 사용**하고, inline-style은 토큰 변수(`var(--...)`)를 통해 일관성을 유지합니다.

### CSS 변수 토큰

```
--bg / --surface / --surface2 / --surface3   배경 단계
--text / --text-muted / --text-faint         텍스트 단계
--border / --border2                         보더
--accent (#4f46e5) / --accent-light / --accent-border  보라 액센트

--radius-sm/md/lg/xl   둥근 모서리 (10/14/20/28)
--elev-1/2/3/4/accent  다층 그림자
--grad-primary/accent/success/warm/sky/soft  시그니처 그라데이션
--glass-bg / --glass-border                  글래스모피즘
--ease / --t-fast/med/slow                   트랜지션
```

다크 모드 토큰은 `[data-theme="dark"]` 셀렉터에 정의되어 있으며, ThemeContext가 light 고정이라 현재는 비활성입니다.

### 핵심 유틸 클래스

- `.surface-card` / `.surface-card.interactive` — 카드 + 호버 lift
- `.gradient-border` — 그라데이션 외곽선
- `.glass` — backdrop-filter 블러 패널
- `.chip` / `.chip.is-active` / `.chip-success/warn/danger/info` — 라운드 칩
- `.btn` + `.btn-fill / .btn-accent / .btn-ghost / .btn-soft` + `.btn-sm / .btn-lg`
- `.stat` / `.stat-label / .stat-value / .stat-sub` — KPI 카드 (호버 시 액센트 바)
- `.section-eyebrow` / `.section-title` — 섹션 헤더
- `.num` — tabular-nums 숫자 표시
- `.hover-zoom`, `.hover-lift`, `.page-in`, `.stagger`, `.card-in`

### 사용 원칙

1. KPI는 `.stat`, 필터 버튼은 `.chip`, 액션 버튼은 `.btn-*` 우선
2. 호버 인터랙션은 트랜지션 토큰(`var(--t-fast) var(--ease)`)으로 통일
3. 라벨/상태 배지는 색상 inline 대신 `.chip-success/warn/danger/info` 사용
4. 그림자는 `--elev-1~4` 사용 — 임의 rgba 값 자제

## 4. 환경변수 체크리스트

`.env.local`에 필요합니다 (Vercel/배포 환경에도 동일 설정):

### 필수
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # 서버 라우트의 admin 작업용
```

### MOLIT (국토부 실거래)
공공데이터포털에서 4개 키 발급. 키가 따로 발급되지 않으면 `MOLIT_SERVICE_KEY` 하나로 폴백:
```
MOLIT_APT_RENT_KEY=...
MOLIT_APT_TRADE_KEY=...
MOLIT_VILLA_RENT_KEY=...
MOLIT_OFFI_RENT_KEY=...
MOLIT_SERVICE_KEY=...   # 폴백
```

### 알림
```
RESEND_API_KEY=...                # 이메일
SOLAPI_API_KEY=...                # 카카오 알림톡
SOLAPI_API_SECRET=...
SOLAPI_PFID=...                   # 플러스친구 ID
SOLAPI_FROM=...                   # 발신 번호
```

### 결제 (카카오페이 정기결제 — 2026-05-27 PG 심사 통과)
**가맹점 정보**: CID `CT75680604` · 사업자 137-81-52231 · 주식회사 맥클린
```
KAKAOPAY_CID=CT75680604                       # 정기결제 가맹점 코드 (변경 가능성 낮음)
KAKAOPAY_SECRET_KEY=...                       # 카카오페이 파트너어드민에서 발급
BILLING_RENEWAL_TOKEN=...                     # 매월 자동결제 cron 인증용 임의 토큰
```
**API 라우트 흐름**:
1. `/api/billing/kakao/ready`         — 결제 준비 → next_redirect_url 응답
2. `/api/billing/kakao/approve`       — pg_token 받아 승인 → sid(빌링키) 저장
3. `/api/billing/kakao/subscription`  — 매월 자동 청구 (cron 또는 운영자 수동)
4. `/api/billing/kakao/cancel` 또는 `/api/billing/cancel` — sid inactive + 구독 취소

**프론트 흐름**: `dashboard/checkout/[planId]` → handlePay → ready → 카카오 인증 → `dashboard/checkout/success?pg_token=...` → approve

**자동 청구 cron 설정 권장**: Supabase Edge Functions 또는 외부 스케줄러에서 매일 새벽 1회
```
POST https://www.ownly.kr/api/billing/kakao/subscription
Header: x-billing-token: $BILLING_RENEWAL_TOKEN
```

**참고 문서**:
- 개발 가이드: https://developers.kakaopay.com/docs/payment/online/common
- 응답코드: https://developers.kakaopay.com/docs/payment/online/reference
- 파트너어드민: https://pg.kakao.com/payment/all
- 가맹점센터: 1644-7108 (평일 09:00~18:00)

## 5. Supabase 마이그레이션 실행

새 마이그레이션이 추가되면 Supabase SQL Editor에서 **번호 순서대로** 실행합니다. 핵심 RLS 마이그레이션:

- `20260520_core_tables_rls.sql` — tenants/payments/contracts/ledger/repairs/vacancies/... 본인 데이터만 접근
- `20260520_billing_waitlist.sql` — 결제 사전등록
- `20260520_certified_mail_status.sql` — 내용증명 발송 상태
- `20260520_vacancy_action_steps.sql` — 공실 액션 플랜 진행 영속화

**중요**: `tenants`, `vacancies` 같은 핵심 테이블은 `user_id` 컬럼 기준 RLS. 새 테이블 추가 시 동일 패턴 따르기.

## 6. 코드 스타일 & 컨벤션

- 파일 확장자: 모두 `.js` (TypeScript 도입 검토 중)
- 한국어 텍스트 사용. 사용자 응답은 **존댓말 필수**
- 따옴표 `"..."`는 JSX 본문에서 `&ldquo;...&rdquo;`로 이스케이프 (lint 에러 회피)
- **react-hooks/set-state-in-effect** 규칙 준수: `useEffect` body 내 동기 `setState` 호출 금지. 대신:
  - `useState(() => initial)` lazy initializer
  - `useMemo`로 derived state
  - 비동기 작업은 `async iife + cancelled 가드` 패턴
- 인라인 스타일 OK지만 토큰 변수 우선. 새 페이지는 가능한 한 유틸 클래스 사용

## 7. 진실성·신뢰 원칙

ownly는 **임대인의 자산 정보**를 다루므로 정직성이 핵심입니다:

- **가짜 후기·통계·실시간 변동률 절대 금지** (랜딩 page.js 정직성 정리 참고)
- 세금/시세/공실률 등 계산은 항상 **기준 시점 명시** + 면책 표기
- 외부 API 연동되지 않은 기능은 **Beta** 라벨 또는 사전등록 UI로 솔직 표시
- PG 심사 등 미준비 상태는 영구 "심사중" 대신 사전등록으로 우회

## 8. 자주 만지는 영역

| 영역 | 파일 | 비고 |
|---|---|---|
| 글로벌 UI | `src/app/globals.css` | 디자인 토큰·유틸 |
| 사이드바/모바일 네비 | `src/components/navigation.js` | 한 줄 압축, 정확한 부분만 교체 |
| 전역 상태 | `src/context/AppContext.js` | Supabase 로드·CRUD·Realtime |
| 세금 계산 | `src/lib/holdingTax.js` | `HOLDING_TAX_BASIS_YEAR` 면책 |
| 위험 점수 | `src/lib/paymentRisk.js`, `tenantCredit.js` | 내부 지표 — "신용점수" 표현 자제 |
| 알림 | `src/app/api/notify`, `kakao/send` | Resend/Solapi 실제 발송 |
| 세입자 외부 화면 | `src/app/portal/[tenantId]`, `request/[tenantId]` | 신뢰 결정 — 깔끔한 디자인 우선 |

## 9. 빌드·검증

- `npx eslint <file>` — 변경 파일 lint
- `npx next build` — 전체 빌드 (127개 정적 페이지 약 5초)
- 핵심 페이지는 변경 후 lint 0 errors 유지

## 10. 작업 시 권장 흐름

1. 변경 대상 파일을 먼저 읽고 (현재 디자인 시스템 사용 여부 확인)
2. inline-style이 많으면 `.stat / .chip / .btn` 토큰 클래스로 점진 교체
3. 호버·포커스 인터랙션은 트랜지션 토큰 사용
4. lint → 빌드 순서로 검증
5. 새 컬럼/테이블 필요 시 `supabase/migrations/` 에 SQL 추가 + RLS 정책 포함

## 11. LLM 코딩 원칙

상세 내용은 `docs/llm-coding-guidelines.md` 참고. 핵심 4원칙:

1. **코딩 전에 생각** — 가정을 명시하고, 해석이 여러 개면 묻는다. 더 단순한 방법이 있으면 먼저 제안.
2. **단순성 우선** — 요청 범위를 넘는 기능·추상화·설정성 금지. 200줄이 50줄로 가능하면 다시 쓴다.
3. **외과적 변경** — 요청과 무관한 코드·주석·포맷을 건드리지 않는다. 내 변경이 만든 고아(import·변수)만 정리.
4. **목표 중심 실행** — 작업을 검증 가능한 성공 기준으로 바꾸고, 검증될 때까지 반복한다.

---

작업 중 막히면 `docs/` 폴더의 운영 메모와 이 가이드를 함께 참고하세요.
