# ownly — Claude 작업 가이드

이 문서는 Claude 같은 AI 에이전트가 ownly 코드베이스에서 작업할 때 즉시 알아야 할 컨벤션·환경변수·디자인 시스템·운영 체크리스트를 정리합니다. **항상 한국어 존댓말로 응답합니다.**

---

## 1. 스택 한눈에

- **Next.js 16** (App Router) + **React 19**
- **Supabase** (Postgres + Auth + Storage + Realtime)
- **Tailwind 4** + 커스텀 디자인 시스템 (`src/app/globals.css`)
- **Recharts** 차트, **lucide-react** 아이콘, **framer-motion** 일부
- **외부 API**: 국토부 실거래(MOLIT), Resend(이메일), Solapi(카카오 알림톡), 카카오페이 정기결제(PG, 2026-05 심사 통과). Toss Payments 는 사용하지 않음 — 잔재 코드 발견 시 제거 (DB 컬럼 `toss_order_id`·`billing_key` 는 이름만 남은 범용 컬럼)

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

### AI (임대료 분석 · 인사이트 코멘트)
```
GROQ_API_KEY=...                  # Groq (openai/gpt-oss-120b). 2026-08-16 llama-3.3-70b 종료 사고 이후 모델 ID 는 src/lib/llm.js 한 곳에서 관리
ANTHROPIC_API_KEY=...             # 선택. 설정하면 Claude 가 1순위, Groq 는 폴백. 둘 중 하나만 있어도 동작. 콘솔 플랜이 "평가 액세스"(무료)면 결제 설정 후 사용
ANTHROPIC_MODEL=claude-opus-5     # 선택. 기본 claude-opus-5, 비용 절감 시 claude-sonnet-5
```
**헬스체크**: `/api/health` 가 매일 07:00 KST(Vercel Cron)에 LLM 1문장 생성·MOLIT 프록시·Supabase 를 점검하고, 하나라도 실패하면 `HEALTH_ALERT_EMAIL`(기본 관리자 메일)로 Resend 알림을 보냅니다. 수동 확인: `curl "https://www.ownly.kr/api/health?token=$CRON_SECRET"`.
AI 호출은 반드시 `src/lib/llm.js` 의 `callLLM` 을 거칩니다 (제공자 폴백·타임아웃·JSON 추출 공통). `/api/ai-pricing` 은 로그인 유저의 월 한도(얼리 서포터 60 · 일반 30 · 정식 과금 후 플랜별)를 **서버에서** 검사하고 성공한 분석만 `ai_usage` 에 기록합니다. 비로그인 호출(/diagnose)은 IP 시간당 10회.

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
**얼리 서포터 (얼리 액세스 기간의 유일한 유료 상품, 2026-09-08)**: 가맹점에 단건결제 CID가 없어(정기결제 CID 만 보유) 건당 결제 대신 정기결제 상품으로 운영합니다. 플러스 플랜 체크아웃이 얼리 액세스 중에는 월 9,900원(정식가 50%)으로 결제되고 `subscriptions.monthly_amount / price_locked_until / billing_cycle` 에 저장되어 갱신 크론이 12개월간 같은 금액을 청구합니다. 서포터 혜택은 **플러스 플랜의 정식 한도 그 자체**(`PLANS.plus.limits`: 내용증명 무제한·알림톡 월 100건·AI 월 60회)이며 `EARLY_SUPPORTER.kakaoMonthly/aiMonthly` 는 여기서 파생됩니다 — 플랜 한도를 바꾸면 요금제 화면·서버 판정(`api/kakao/send`·`api/ai-pricing`·`AppContext.limitFor`)·서포터 안내가 함께 바뀝니다. 얼리 액세스 중 무료 유저 한도는 `EARLY_ACCESS_CERTIFIED_FREE / KAKAO_FREE / AI_FREE`(3건·30건·30회), 종료일은 `EARLY_ACCESS_END`. 공개 `/pricing` 의 기능 목록도 `PLANS[*].features` 에서 파생되므로 문구를 두 곳에 쓰지 않습니다. `certified_credits` 는 친구 초대 보너스 발급권 용도로만 남아 있습니다.
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
- `20260709_events_tracking.sql` — 퍼널 이벤트 테이블
- `20260908_growth_loop.sql` — 익명 도구 이벤트 정책 · 관리자 퍼널 RPC · 내용증명 발급권(certified_credits/credit_purchases) · 발급권 차감 RPC
- `20260908_landlord_sms.sql` — 임대인 본인 미납 문자 옵트인 컬럼(newsletter_subscribers.sms_unpaid)
- `20260908_early_supporter.sql` — 구독자별 청구 기준가·주기·가격 고정 만료일(subscriptions.monthly_amount 등)

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
- **유료 기능(AI 분석·알림톡·결제)은 배포 후 프로덕션 엔드포인트를 curl 로 실제 호출해 확인** — 2026-08 Groq 모델 폐기로 AI 가 3주간 죽어 있던 사고의 교훈
- Windows Git Bash 에서 한글 JSON 을 `curl -d '...'` 로 보내면 인코딩이 깨져 서버가 다른 값으로 받습니다. 반드시 UTF-8 파일로 저장 후 `--data-binary @file` 사용. AI 분석 라우트는 `x-debug-token: $CRON_SECRET` 헤더로 MOLIT 조회 진단(`debug.rows/errors`)을 응답에 포함합니다

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
