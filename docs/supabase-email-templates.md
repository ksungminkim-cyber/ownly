# Supabase 인증 이메일 템플릿 (온리 브랜드 · 한글)

Supabase 대시보드 → **Authentication → Emails → Templates**에서 각 템플릿의 **Subject**와 **Message body(Source/HTML)**에 아래 내용을 그대로 붙여넣으세요.

> 발신자는 커스텀 SMTP 설정의 Sender(`온리 <noreply@ownly.kr>`)를 따릅니다.
> Supabase 변수(`{{ .ConfirmationURL }}` 등)는 Go 템플릿 문법이라 **그대로** 두어야 링크가 자동 생성됩니다.
> 이메일 HTML은 클라이언트 호환을 위해 table 레이아웃 + 인라인 스타일로 작성했습니다. (외부 이미지 없이 텍스트 로고 사용)

---

## 1. Confirm signup — 회원가입 이메일 인증

**Subject**
```
[온리] 이메일 인증을 완료해 주세요
```

**Message body**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;margin:0;padding:32px 0;font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,39,68,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1a2744,#5b4fcf);padding:28px 32px;">
        <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">온리</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.6);margin-left:6px;">Ownly</span>
      </td></tr>
      <tr><td style="padding:36px 32px 8px;">
        <h1 style="font-size:20px;font-weight:800;color:#1a2744;margin:0 0 14px;">이메일 인증을 완료해 주세요</h1>
        <p style="font-size:14px;color:#5b5b6a;line-height:1.7;margin:0 0 24px;">
          온리에 가입해 주셔서 감사합니다. 아래 버튼을 눌러 이메일 인증을 마치면
          바로 임대 관리를 시작하실 수 있습니다.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="border-radius:12px;background:linear-gradient(135deg,#1a2744,#5b4fcf);">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">이메일 인증하기 →</a>
        </td></tr></table>
        <p style="font-size:12px;color:#8a8a9a;line-height:1.7;margin:0 0 8px;">
          버튼이 눌리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.
        </p>
        <p style="font-size:12px;color:#5b4fcf;line-height:1.6;margin:0 0 8px;word-break:break-all;">{{ .ConfirmationURL }}</p>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;border-top:1px solid #f0efe9;">
        <p style="font-size:11px;color:#a0a0b0;line-height:1.7;margin:0;">
          본 메일은 온리(Ownly) 회원가입 과정에서 발송되었습니다. 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.<br>
          (주)맥클린 · 사업자등록번호 137-81-52231 · 문의 inquiry@mclean21.com
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Reset Password — 비밀번호 재설정

**Subject**
```
[온리] 비밀번호 재설정 안내
```

**Message body**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;margin:0;padding:32px 0;font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,39,68,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1a2744,#5b4fcf);padding:28px 32px;">
        <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">온리</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.6);margin-left:6px;">Ownly</span>
      </td></tr>
      <tr><td style="padding:36px 32px 8px;">
        <h1 style="font-size:20px;font-weight:800;color:#1a2744;margin:0 0 14px;">비밀번호를 재설정하세요</h1>
        <p style="font-size:14px;color:#5b5b6a;line-height:1.7;margin:0 0 24px;">
          비밀번호 재설정 요청을 받았습니다. 아래 버튼을 눌러 새 비밀번호를 설정해 주세요.
          이 링크는 보안을 위해 일정 시간 후 만료됩니다.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="border-radius:12px;background:linear-gradient(135deg,#1a2744,#5b4fcf);">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">비밀번호 재설정 →</a>
        </td></tr></table>
        <p style="font-size:12px;color:#8a8a9a;line-height:1.7;margin:0 0 8px;">
          버튼이 눌리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.
        </p>
        <p style="font-size:12px;color:#5b4fcf;line-height:1.6;margin:0 0 8px;word-break:break-all;">{{ .ConfirmationURL }}</p>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;border-top:1px solid #f0efe9;">
        <p style="font-size:11px;color:#a0a0b0;line-height:1.7;margin:0;">
          본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 계정은 안전하게 유지됩니다.<br>
          (주)맥클린 · 사업자등록번호 137-81-52231 · 문의 inquiry@mclean21.com
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 3. Magic Link — 매직 링크 로그인

> 소셜 로그인(네이버 등) 매직링크 흐름에서 사용될 수 있습니다.

**Subject**
```
[온리] 로그인 링크를 보내드립니다
```

**Message body**
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;margin:0;padding:32px 0;font-family:'Apple SD Gothic Neo','Malgun Gothic',Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,39,68,0.08);">
      <tr><td style="background:linear-gradient(135deg,#1a2744,#5b4fcf);padding:28px 32px;">
        <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">온리</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.6);margin-left:6px;">Ownly</span>
      </td></tr>
      <tr><td style="padding:36px 32px 8px;">
        <h1 style="font-size:20px;font-weight:800;color:#1a2744;margin:0 0 14px;">로그인 링크를 보내드립니다</h1>
        <p style="font-size:14px;color:#5b5b6a;line-height:1.7;margin:0 0 24px;">
          아래 버튼을 누르면 별도의 비밀번호 입력 없이 바로 로그인됩니다.
          이 링크는 보안을 위해 일정 시간 후 만료됩니다.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="border-radius:12px;background:linear-gradient(135deg,#1a2744,#5b4fcf);">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">로그인하기 →</a>
        </td></tr></table>
        <p style="font-size:12px;color:#8a8a9a;line-height:1.7;margin:0 0 8px;">
          버튼이 눌리지 않으면 아래 주소를 브라우저에 붙여넣어 주세요.
        </p>
        <p style="font-size:12px;color:#5b4fcf;line-height:1.6;margin:0 0 8px;word-break:break-all;">{{ .ConfirmationURL }}</p>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;border-top:1px solid #f0efe9;">
        <p style="font-size:11px;color:#a0a0b0;line-height:1.7;margin:0;">
          본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.<br>
          (주)맥클린 · 사업자등록번호 137-81-52231 · 문의 inquiry@mclean21.com
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 적용 후 확인
1. 각 템플릿 저장 후, 새 이메일 주소로 **회원가입 테스트** → 받은편지함에 `온리 <noreply@ownly.kr>`로 도착하는지 확인
2. 인증 버튼 클릭 → `/auth/callback` 정상 리다이렉트 확인
3. 스팸함으로 갈 경우 Resend 도메인 인증(SPF·DKIM) 상태를 다시 확인
