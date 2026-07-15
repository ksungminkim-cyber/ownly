# 리텐션 주간 다이제스트 크론

가입 후 재방문이 없는 문제(활성화 0)를 해결하기 위한 **서버 발신 재방문 트리거**입니다.
유저 데이터에 조치할 일(미납·계약 만료 임박)이 있을 때만 주 1회 이메일을 보내 대시보드로 다시 데려옵니다.

## 엔드포인트

`GET /api/notify` — 전체 유저 순회 후 각자에게 1통씩 발송

- **미납 우선**: 이번 달 미납 세입자가 있으면 미납 알림, 없으면 만료 임박(≤90일) 알림
- **빈 메일 금지**: 조치할 게 없으면 발송하지 않음 (스팸 방지)
- **중복 방지**: `newsletter_subscribers.last_sent_at` 이 5일 이내면 skip → 하루 여러 번 돌아도 안전
- **opt-out 존중**: `newsletter_subscribers.weekly_digest = false` 인 유저는 제외
- 발송 후 `notification_logs`(type: unpaid|expiring, channel: email) 기록

응답 예: `{ "success": true, "summary": { "processed": 16, "sent": 3, "skippedRecent": 2, "skippedNothing": 11, "skippedOptOut": 0, "errors": 0 } }`

## 인증

`CRON_SECRET`(권장) 또는 `CRON_TOKEN` / `BILLING_RENEWAL_TOKEN` 값과 일치해야 실행됩니다. 세 방식 지원:
- `Authorization: Bearer <토큰>` — **Vercel Cron 이 자동 주입** (CRON_SECRET 사용 시)
- `x-cron-token: <토큰>` 헤더
- `?token=<토큰>` 쿼리 (수동 테스트용)

토큰 불일치·미설정 시 401.

## 스케줄

`vercel.json` 에 등록됨 — 매주 월요일 00:00 UTC(= 한국 월요일 09:00):
```json
{ "path": "/api/notify", "schedule": "0 0 * * 1" }
```

### 필수 설정 (Vercel 환경변수)
`CRON_SECRET` 을 Vercel 프로젝트 환경변수에 추가하세요. Vercel Cron 이 이 값을 Bearer 토큰으로 자동 전송합니다.
외부 스케줄러를 쓸 경우: `curl -H "x-cron-token: $CRON_SECRET" https://www.ownly.kr/api/notify`

## 수동 실행/테스트
```
curl "https://www.ownly.kr/api/notify?token=<CRON_SECRET>"
```

## 관련
- 발송 로직: `src/app/api/notify/route.js` (sendUnpaidNotice / sendExpiringNotice)
- 효과 측정: 발송 후 `dashboard_view` 이벤트 증가로 재방문 확인 ([analytics-events.md](analytics-events.md))
