---
date: 2026-07-26
type: development-log
source: grok-build-session
also: helena_phone/_notebook/99-devlog.md §50–61
---

# 개발 일지 — Grok 세션 일괄 (2026-07-25 ~ 2026-07-26)

> 원본 SSOT: `helena_phone` 레포 `_notebook/99-devlog.md`  
> 이 파일은 helana_log `logs/` 백업·검색용 복사본이다.  
> helana_log **본문 정체성**은 행정 대화록(`docs/`)이며, 본 파일은 생태계 구축 기술 일지다.

## DAY 3–4 — 2026-07-25 ~ 2026-07-26 (Grok Build 세션 일괄)

> 세션 주체: **Grok (SuperGrok / Grok Build TUI)**  
> 작업 루트: `/root/work` (helena_phone) · `/tmp/sites/*` (위성 Pages)  
> 주제 축: 에이전트 운용 · 웹진 랜딩 · 홈 화면 아이콘 · **행정 대화록 정체성**

### 50. SuperGrok 사용량 · 커뮤니티 리서치

- SuperGrok **주간 Usage pool** 구조 확인 (한도·리셋 주기 커뮤니티 정보 조사)
- 토큰 단위 과금이 아니라 구독 풀 소모 모델 → 일지 §48과 정합
- 실무 함의: 긴 코딩/리서치 세션은 풀 소모 체감 큼 → 역할 분담(cc/ds/grok) 유지

### 51. Termux 별칭 `gr` → Grok

- Termux에서 `grok` CLI 호출 단축: 별칭 **`gr`**
- 기존 `cc`(Claude Code) · `ds`(Aider/DeepSeek)와 3단 단축 체계 정렬
- 목표 UX: 폰 한 대에서 에이전트 전환 마찰 최소화

### 52. 에이전트 3종 비교 · 텔레그램 문서화

| 단축 | 도구 | 역할 (당시 합의) |
|------|------|------------------|
| `cc` | Claude Code (+ DeepSeek radar 등) | 메인 코딩·레포 작업 |
| `ds` | Aider + DeepSeek | 보조 패치·디프 중심 |
| `gr` / Grok | Grok Build / SuperGrok | 리서치·웹진·이미지·채팅 아카이브·네이버 드래프트 |

- 비교 문서를 **텔레그램용**으로 정리 후, 요청에 따라 **URL 위주**로 전달 형태 조정
- 영문 → 국문 정리 이력 포함

### 53. Aider (`ds`) 장애 복구 · 색상 · 강제 종료

**증상**
- `ds` 세션이 Claude/다른 정체성으로 환각(hallucination)하거나 설정 꼬임
- 색상(diff/테마) 가독성 문제
- 프로세스가 멈춰 kill 필요

**조치**
- Aider conf / history / wrapper 점검·수정 (정체성·모델 경로 고정)
- 색상 설정 정리
- **stuck Aider는 `pgrep -f` 단독이 아니라 PID 기준 종료** (오탐·미종료 방지)
- 복구 후 `ds`가 보조 코딩 레인으로 다시 사용 가능하게

### 54. helena_phone — A급 웹진 랜딩 (Playwright 검증)

**목표:** 갤럭시 S21 워크스테이션 서사를 **에디토리얼 웹진**으로 랜딩

**구현 요약**
- `index.html` 전면 개편: masthead, chapter rail, cover, accordion 챕터, install 섹션
- `assets/webzine.css` · `assets/webzine.js` · `scripts/build_webzine.py` 체계
- 모바일 터치 타깃·safe-area·버거 메뉴 (드로어 **밖**에 토글 — 드로어 안에 두면 닫기 불가)
- 아코디언: 닫힘 시 잔여 높이(약 28px) → `0fr` / overflow 정리
- `const chapters` 이중 선언 충돌 → `accChapters` / `chapterIds` 등으로 분리

**배포 장애 타임라인**
| 이슈 | 대응 |
|------|------|
| Jekyll / nested git | `.nojekyll`, 경로 정리 |
| Pages 배포 stuck (예: `1923e83`) | 배포 취소 후 재시도, peaceiris → `gh-pages` 브랜치, Actions `deploy-pages` |
| 라이브 반영 지연 | Actions SUCCESS 확인 후 curl 200 검증 |
| Playwright “대충” 검증 지적 | 실제 브라우저 스냅/높이·아코디언 동작 재검증 루프 |

**Install (PWA 아님)**
- **서비스 워커 없음**
- `site.webmanifest` + `icons/` (16/32/192/512/maskable/svg/apple-touch)
- `start_url` / `scope` 절대 경로: `/helena_phone/`
- Chrome/Edge “홈 화면에 추가” 아이콘 정상 목표

**라이브:** https://helena751107.github.io/helena_phone/

### 55. 생태계 위성 4종 — 웹진 랜딩 통일

각 레포에 helena_phone 톤의 랜딩 + Giscus + 생태계 링크 바:

| 레포 | URL |
|------|-----|
| helana_log | https://helena751107.github.io/helana_log/ |
| helana-faith | https://helena751107.github.io/helana-faith/ |
| helena-piano | https://helena751107.github.io/helena-piano/ |
| helena-psycare | https://helena751107.github.io/helena-psycare/ |

- 공통: sticky mast, accordion, theme toggle, hub 링크
- 작업 클론 경로: `/tmp/sites/{repo}` → `main` push
- 텔레그램 안내는 **URL 위주** (장문 HTML 대신)

### 56. 전 레포 파비콘 · 매니페스트 (서비스 워커 없음)

**요구:** helena_phone처럼 “바로 가기 추가 시 아이콘” — SW 없이

**아이콘 생성**
- Playwright로 SVG 모노그램 → PNG 일괄
  - Log **L** 청록 · Faith **F** 금 · Piano **P** 라일락 · PsyCare **C** 코랄
- 파일: `icons/favicon-16|32.png`, `apple-touch-icon.png`, `icon-192|512.png`, `icon-maskable-512.png`, `icon.svg`

**연결**
- 각 `site.webmanifest`: `id`/`start_url`/`scope` = `/repo/`
- icons src 절대 경로 `/repo/icons/...` (192/512/maskable/svg/favicon-32)
- `index.html` head: favicon 16/32, svg, apple-touch, mask-icon, application-name, apple-mobile-web-app-*

**배포 커밋 (위성, 예)**
- helana_log `d06ca2e` 등 — *Add local install icons and web app manifest*
- 라이브 검증: 4레포 × manifest/icon-192/512 **HTTP 200**

### 57. helana_log 정체성 전환 — 대한민국 행정 대화록

**이전:** 일반 학습·트러블슈팅·일일 로그 창고  
**이후:** 복합 돌봄 가정 × 한국 행정 **대화록 아카이브**

**가정 맥락 (공개 기록 단위)**
| 코드 | 축 | 맥락 |
|------|-----|------|
| DW | 장애·정신건강 복지 | 조현병 등 당사자 **누나** |
| BL | 기초생활 보장 | 수급·생계 안전망 가구 |
| DC | 치매·노인 돌봄 | **치매 어머니** |

**문서 트리 (`docs/`)**
| 경로 | 역할 |
|------|------|
| `IDENTITY.md` | 정체성 헌장 (한 줄 정의, 아닌 것, 톤) |
| `METHOD.md` | Fact / Feel / Gap / Fix / Next |
| `dialogue/_TEMPLATE.md` | 빈 템플릿 |
| `dialogue/2026-07-26-opening.md` | 성격 전환 첫 대화록 |
| `tracks/disability-welfare.md` 등 | 트랙별 빈칸 체크리스트 |
| `solutions/README.md` | 솔루션 승격 보드 |
| `logs/README.md` | 날것 캡처 vs 정제 대화록 |
| `CLAUDE.md` | AI 규칙 갱신 (개인정보·단정 금지) |

**커밋:** `6269eeb` — *Rebrand Helana Log as Korea admin dialogue archive*

**브랜드 카피**
> 행정은 창구로 쪼개지고, 가정은 하루로 이어진다.

**아이콘 성격 업데이트**
- 인장(seal) 링 + 서류 플레이트 + L + 「行政日誌」
- manifest `short_name`: **행정대화록**
- categories: government / social / education

**경계 (명시)**
- 법률 자문·수급 대행·의료 가이드 아님
- 공무원 실명 비난 채널 아님 → 제도·프로세스·정보 설계
- 긴급 시 공식 경로(정신건강복지센터·119 등) 우선
- 주민번호·계좌·정확한 주소·진료 원문 커밋 금지

### 58. helana_log 랜딩 — 문서 온페이지 임베드

**요구:** “랜딩 페이지에 업데이트” — GitHub 링크만이 아니라 **사이트 안에서** 읽히게

**랜딩 섹션**
1. 히어로 + 한 집의 세 축 + 인용(느낀 바)
2. `#charter` 정체성 헌장 요약
3. `#method` 기록 방법 **5단** 카드
4. `#tracks` DW/BL/DC + 자주 비는 틈 불릿
5. `#dialogue` 2026-07-26 대화록 **전문 임베드** (Fact~Next 표 포함)
6. `#solutions` 솔루션 보드 (위기 1p / 갱신 체크 / 타임라인 / 질문 카드)
7. 경계 · 문서 지도 · 홈 화면 추가 · Giscus

**커밋:** `a3b8ae9` — *Expand landing with on-page charter, method, and dialogue*  
**라이브:** https://helena751107.github.io/helana_log/ (캐시 시 hard refresh)

### 59. 세션 산출물 맵 (파일·URL)

```
helena_phone
  index.html, assets/webzine.*, site.webmanifest, icons/
  scripts/build_webzine.py
  _notebook/99-devlog.md  ← 본 일지

helana_log  (행정 대화록)
  index.html, site.webmanifest, icons/
  docs/IDENTITY|METHOD|tracks|dialogue|solutions
  logs/ (날것) + 본 일지 복사본 logs/2026/07/DevLog_Grok_20260726.md

helana-faith / helena-piano / helena-psycare
  index.html, site.webmanifest, icons/ (각 모노그램)
```

**Pages (전부 main 배포 전제, SW 없음)**
- https://helena751107.github.io/helena_phone/
- https://helena751107.github.io/helana_log/
- https://helena751107.github.io/helana-faith/
- https://helena751107.github.io/helena-piano/
- https://helena751107.github.io/helena-psycare/

### 60. 다음 액션 (일지 기준 백로그)

- [ ] helana_log: 실제 창구·전화 후 `docs/dialogue/` 템플릿 1편
- [ ] `docs/solutions/dw-crisis-map.md` 위기 연락 1페이지
- [ ] BL 갱신 체크리스트 · DC 하루 타임라인
- [ ] 위성 랜딩 카피 중 아직 “학습 로그” 잔향 있으면 트랙별 톤 정리
- [ ] helena_phone 허브 카피에 helana_log **행정 대화록** 한 줄 반영
- [ ] 노출된 토큰 패턴 있으면 재발급·로그 마스킹 (이전 ParksyLog 경고와 동일 원칙)

### 61. 교훈 (이번 세션)

1. **Pages는 커밋 ≠ 라이브** — Actions/브랜치 stuck 먼저 보고 curl 200으로 닫을 것  
2. **프로젝트 사이트는 manifest 절대 경로** (`/repo/icons/...`) 필수  
3. **아이콘은 레포 로컬 자산** — 허브 아이콘 빌려 쓰면 설치 아이콘이 전부 같아짐  
4. **정체성 바꾸면 문서 → 랜딩 → manifest short_name → 아이콘** 순으로 한 세트  
5. **대화록은 Fact/Feel 분리** — 행정 기록의 재사용 가능성 핵심  
6. **에이전트 킬은 PID** — 패턴 매칭 kill은 놓치거나 과다 킬

---

*§50–61 기록 시각: 2026-07-26 · 작성: Grok Build · 저장: `_notebook/99-devlog.md` + helana_log `logs/2026/07/`*

