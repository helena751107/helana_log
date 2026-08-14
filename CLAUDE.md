# CLAUDE.md — 헬레나가 사는 법 (Helana Log)

> 이 레포는 **헬레나(누나)의 인생 스토리**다.  
> 조현병과 함께 살아가는 당사자 누나가, 신앙·음악·가족의 돌봄 속에서  
> 하루를 살아내는 방식을 기록한다. 일반 개발 로그도, 행정 민원 기록도 아니다.

## 작업 전 읽을 것
- `docs/IDENTITY.md` — 정체성 헌장
- `docs/METHOD.md` — 스토리 형식
- `docs/dialogue/_TEMPLATE.md` — 새 글 템플릿

## 파일 구조
- `index.html` — 랜딩 (정체성 요약)
- `site.webmanifest` + `icons/` — 홈 화면 추가용 (서비스 워커 없음)
- `docs/` — 헌장 · 삶의 장(tracks) · 스토리(dialogue) · 솔루션
- `logs/` — 날것 캡처 (정제 전)
- `telegram/` — 수집 봇 (민감정보 주의)

## 발행 인프라 (어디에 있나)
- **발행 엔진은 `helena_phone`에 있다** — `scripts/publish.py`(실행기), `scripts/save_tistory_cookie.py`(시드), `tistory-naver/post.py`(티스토리), `tistory-naver/session_post.py`(네이버).
- 여기(helana_log)에는 **설계 지도** `docs/solutions/tistory-automation-map.md`와 **CI**(`.github/workflows/log-to-tistory.yml` = md→TG, `tistory-sync.yml` = RSS 당겨오기)만 있다.
- 세션 쿠키(`.tistory_session_*.json`, `tistory-naver/cookies/`, `accounts.json`)는 **절대 커밋 금지** — 공개 레포에 새면 계정 탈취.

## AI 행동 규칙
- 개인 식별정보·진료 원문·계좌·주민번호를 커밋하지 말 것
- 스토리는 장면(Scene) / 느낀 것(Feel) / 살아낸 법(Way) / 다음 하루(Next) 구조를 유지
- 법률·의료 단정 표현 금지 (“확인 필요”로 돌릴 것)
- 커밋은 작게, 메시지에 “왜” 포함
- 랜딩 카피는 헌장과 모순되지 않게
