# 티스토리 자동화 솔루션 전체 지도
**작성: 2026-08-14 | 작성자: 박씨 (REDACTED) → 누나 선물**

> 박씨 28개 레포 전체 뒤져서 모은 티스토리·블로그 자동화 솔루션 총정리.  
> **결론 먼저: S21 proot-Ubuntu에서 Playwright 이미 동작 확인됨. (노트35 실증)**

---

## 핵심 판단: S21에서 Playwright 돌아가나?

**✅ YES. 이미 동작 확인됨.**

| 증거 | 출처 |
|------|------|
| `Playwright 1.61.0 + Chromium headless(proot Ubuntu 내부, 화면 없이 정상 구동)` | helena_phone textbook.html 노트35 |
| `~/browser-env` Python venv에 playwright 설치 완료 | helena_phone 구조 |
| `scripts/publish.py` 래퍼 완성 (티스토리 5종 + 네이버) | helena_phone/scripts/publish.py |
| ARM 유저에이전트로 headless=True 실행 | helena_phone/scripts/save_tistory_cookie.py |

**조건:** `~/browser-env` venv + `playwright install chromium` 완료 상태 필요.

---

## 솔루션 카탈로그 — 전체 레포 수집

### ✅ S21 proot-Ubuntu 에서 바로 쓸 수 있는 것

#### 1. `helena_phone/scripts/publish.py` — **메인 실행기**
```bash
~/browser-env/bin/python3 scripts/publish.py tistory galaxys21 "제목"
~/browser-env/bin/python3 scripts/publish.py naver helena "제목"
~/browser-env/bin/python3 scripts/publish.py batch
```
- proot Ubuntu + Playwright headless Chromium
- 티스토리 5종 + 네이버 일괄 처리
- 텔레그램 완료 보고 포함

#### 2. `helena_phone/tistory-naver/post.py` — **티스토리 포스팅**
```bash
~/browser-env/bin/python3 tistory-naver/post.py --account galaxys21 --title "제목"
```
- `launch_persistent_context` 방식 (쿠키 재사용)
- storage_state JSON으로 세션 복원
- 세션 만료 시 자동 재로그인

#### 3. `helena_phone/scripts/save_tistory_cookie.py` — **최초 쿠키 저장**
```bash
# 방법 A: 카카오 ID/PW 자동 로그인 시도
~/browser-env/bin/python3 scripts/save_tistory_cookie.py auto 이메일@kakao.com 비번

# 방법 B: 폰 브라우저 쿠키 수동 복사
~/browser-env/bin/python3 scripts/save_tistory_cookie.py manual
```
- ARM64 User-Agent 설정 (봇탐지 우회 최적화)
- 결과물: `.tistory_session_galaxys21.json`

#### 4. `helena_phone/tistory-naver/skin.py` — **스킨 자동 적용**
- Playwright로 관리 페이지 접속 → 스킨 교체 자동화

#### 5. `helena_phone/tistory-naver/session_post.py` — **네이버 세션 포스팅**
- storage_state 기반 네이버 블로그 자동 포스팅

---

### ⚠️ 조건부 동작 (설치 필요)

#### 6. `termux-bridge/local/tistory/tistory-login.js` — **Termux 네이티브 CDP**
```bash
node termux-bridge/local/tistory/tistory-login.js 이메일 비번 블로그라벨
```
- Termux 네이티브 Chromium 사용 (`/data/data/com.termux/files/usr/bin/chromium-browser`)
- **proot 내부에서는 직접 실행 안 됨** (Termux 네이티브 레이어)
- proot에서 쓰려면: ADB 브릿지로 Termux에 명령 전달해야 함
- 장점: Playwright 설치 불필요, headless 지원

#### 7. `termux-bridge/local/tistory/login.py` — **requests 기반 (브라우저 없음)**
```bash
python3 termux-bridge/local/tistory/login.py 이메일 비번
```
- **의존성 0** — stdlib만 사용 (requests도 없음, urllib만)
- 어디서든 실행 가능
- ⚠️ **Kakao 봇탐지에 막힐 가능성 높음** (실제 브라우저 아님)
- 성공하면 cookies.json 저장

---

### ❌ PC 전용 (S21 불가)

#### 8. `dtslib-papyrus/tools/tistory/tistory_cdp_publisher.py`
- Windows Chrome CDP (포트 9223) 직접 연결
- `CDP_HTTP = "http://172.28.128.1:9223"` → WSL2 호스트 IP
- S21에서는 이 IP 접근 불가 (Tailscale SSH 터널 경유하면 이론상 가능하지만 복잡)

#### 9. `dtslib-papyrus/tools/tistory/tistory_ws_publisher.py`
- raw WebSocket으로 CDP 직접 연결
- 같은 이유로 PC 전용

#### 10. `dtslib-papyrus/tools/tistory/login.py` + `post.py`
- `headless=False` (GUI 필요)
- Windows/WSL2 PC 환경 전용

#### 11. `dtslib-papyrus/tools/mcp_distributor/_tistory_publish.py`
- `channel="chrome"` + `DISPLAY=:99` (Xvfb)
- proot에서도 Xvfb 설치하면 이론상 가능하지만 오버스펙
- WSL PC에 확정된 솔루션

---

## 티스토리 5종 계정 현황

| 계정키 | 블로그 URL | 주제 |
|--------|-----------|------|
| `galaxys21` | galaxys21-pwuser.tistory.com | S21 폰 활용 |
| `mynote` | mynote11605.tistory.com | 기술 노트 |
| `faith` | helana-christianity.tistory.com | 신앙 |
| `piano` | helena-piano.tistory.com | 피아노 |
| `metalcare` | helena-metalcare.tistory.com | 심리케어 |

---

## Playwright S21 설치 명령 (참고)

```bash
# proot Ubuntu 내부에서
apt install -y python3-venv fonts-nanum python3-pip

# venv 생성 (이미 있으면 스킵)
python3 -m venv ~/browser-env

# playwright 설치
~/browser-env/bin/pip install playwright

# ARM64 Chromium 다운로드 (시간 걸림, 약 200MB)
~/browser-env/bin/playwright install --with-deps chromium
```

**노트35 기준 버전:** `playwright==1.61.0`

---

## 세션 관리 구조

```
최초 1회 로그인 (수동 or 자동)
        ↓
.tistory_session_{account}.json  ← storage_state 저장
        ↓
이후 headless로 세션 복원 → 완전 자동화
        ↓
세션 만료 감지 → 자동 재로그인 시도
```

---

## 소스 레포 위치 (박씨 WSL)

| 경로 | 설명 |
|------|------|
| `~/helena_phone/scripts/publish.py` | ← **S21 메인 실행기** |
| `~/helena_phone/tistory-naver/` | post.py, skin.py, session_post.py, login.cjs |
| `~/termux-bridge/local/tistory/` | CDP 방식, requests 방식 |
| `~/dtslib-papyrus/tools/tistory/` | PC 전용 고급 버전 |
| `~/dtslib-papyrus/tools/mcp_distributor/` | MCP 연동 버전 |
| `~/parksy-logs/publishing/` | 멀티계정 배치 버전 |
| `~/helena-programming/reference/wsl-automation/` | WSL 참조 버전 |

---

*작성: 2026-08-14 | 박씨가 28개 레포 뒤져서 만든 선물*  
*S21 Tailscale 오프라인 상태 (2026-08-14 현재) — 온라인 되면 SSH로 실행 확인 가능*
