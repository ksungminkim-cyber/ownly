# 퍼널 이벤트 계측 — 조회 가이드

가입 후 유저가 실제로 뭘 하는지(재로그인·물건등록·결제진입)를 측정합니다.

## 셋업 (1회)

`supabase/migrations/20260709_events_tracking.sql`을 Supabase **SQL Editor**에서 실행하세요.
실행 전까지 track() 호출은 조용히 무시되므로 앱 동작에는 영향 없습니다.

## 기록되는 이벤트 (src/lib/track.js)

| 이벤트 | 시점 | props |
|---|---|---|
| `login` | 이메일 로그인 성공 / 소셜·인증 콜백 완료 | `method`: password·callback |
| `dashboard_view` | 대시보드 진입 (유저당 하루 1회) | `tenants`: 보유 물건 수 |
| `property_added` | 물건 등록 성공 (샘플 제외, 모든 경로) | `pType` |
| `sample_seeded` | 샘플 데이터 체험 시작 | |
| `sample_removed` | 샘플 데이터 삭제 (체험 완료 신호) | |
| `checkout_view` | 결제 페이지 진입 | `plan` |
| `pay_click` | 결제하기 버튼 클릭 | `plan`, `cycle` |

## 핵심 퍼널 쿼리 (SQL Editor에서 실행)

### 1. 가입 → 활성화 퍼널 (유저별 현황)
```sql
select
  u.email,
  u.created_at::date as 가입일,
  max(e.created_at)::date as 마지막_활동일,
  count(*) filter (where e.event = 'dashboard_view') as 방문일수,
  count(*) filter (where e.event = 'property_added') as 물건등록,
  count(*) filter (where e.event = 'sample_seeded') as 샘플체험,
  count(*) filter (where e.event = 'checkout_view') as 결제페이지,
  count(*) filter (where e.event = 'pay_click') as 결제클릭
from auth.users u
left join public.events e on e.user_id = u.id
group by u.id, u.email, u.created_at
order by u.created_at desc;
```

### 2. 주간 활성 유저 (재방문 추이)
```sql
select date_trunc('week', created_at)::date as 주,
       count(distinct user_id) as 활성유저
from public.events
where event = 'dashboard_view'
group by 1 order by 1 desc;
```

### 3. 이벤트별 총계 (최근 30일)
```sql
select event, count(*) as 횟수, count(distinct user_id) as 유저수
from public.events
where created_at > now() - interval '30 days'
group by event order by 횟수 desc;
```

### 4. 가입만 하고 이벤트가 전혀 없는 유저 (윈백 대상)
```sql
select u.email, u.created_at::date as 가입일
from auth.users u
left join public.events e on e.user_id = u.id
where e.id is null
order by u.created_at desc;
```

## 해석 기준

- **방문일수 0** → 인증 메일/온보딩 문제 (가입 완료 자체가 안 됨)
- **방문 있음 + 물건등록 0 + 샘플체험 0** → 첫 화면에서 가치를 못 느낌 (온보딩 개선 필요)
- **샘플체험 있음 + 물건등록 0** → 체험은 했지만 본인 데이터 입력 장벽 (퀵등록 개선 필요)
- **물건등록 있음 + checkout 0** → 무료 플랜으로 충분하거나 유료 가치 인지 부족 (페이월/기능 재배치)
