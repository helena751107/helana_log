---
date: 2026-08-09
source: devlog-compilation
agent: Claude
---

# 티스토리 시행착오 전체 이력 — 인터랙티브 인포그래픽 대화록

> helena_phone 프로젝트 18일간(7/23~8/9)의 티스토리 관련 모든 시도·실패·전환·완성 이력.

## 1. 상황 — 우리가 티스토리를 만난 이유

헬레나 생태계는 GitHub Pages 5종(helena_phone·helana_log·helana-faith·helena-piano·helena-metalcare)을 중심으로 돌아간다. 하지만 한국에서 GitHub Pages는 검색이 안 된다. 네이버·티스토리는 한국 검색의 관문.

**5개 티스토리 = 5개 GitHub 레포 = 5개 YouTube 채널 (1:1:1 매칭):**

| 티스토리 | 레포 | 역할 |
|----------|------|------|
| galaxys21-pwuser | helena_phone | IT·개발·워크벤치 |
| helena-metalcare | helena-metalcare | 돌봄·복지·행정 |
| helena-piano | helena-piano | 음악·취미 |
| helana-christianity | helana-faith | 신앙 |
| mynote11605 | — | 자유 수첩 |

## 2. 느낀 바 — 3중 장벽에 막히다

### 시도 #1: Playwright 자동 로그인 → Kakao OAuth KOE006

"티스토리 Open API가 2024년 2월에 완전 종료됐다. 그럼 Playwright로 브라우저 흉내 내서 로그인하면 되지 않을까?"

**결과: ❌ 실패.** Kakao OAuth가 `KOE006` 에러(앱 관리자 설정 오류)를 뱉으며 가로막았다. Tistory 쪽 설정 문제라 서버 사이드에서 우회 불가.

### 시도 #2: 북마크릿 → Android Chrome 차단

"브라우저에서 북마크릿 실행해서 자동으로 글 쓰게 하면?"

**결과: ❌ 실패.** Android Chrome이 북마크릿 실행을 막는다. 구글 7년째 방치된 버그. Firefox는 가능하지만 번거롭다.

### 시도 #3: Cookie DB 직접 접근 → Android sandbox 차단

"Chrome 쿠키 DB에 직접 접근해서 세션을 가져오면?"

**결과: ❌ 실패.** `/data/data/` Android 앱 샌드박스. root 없이 접근 불가.

### 시도 #4: `am start` Intent → SecurityException

"Android Intent로 javascript URL을 실행하면?"

**결과: ❌ 실패.** Android SecurityException. 보안상 당연한 결과.

### 시도 #5: GitHub Pages 추출 페이지 → 배포 지연

"GitHub Pages에 쿠키 추출기 페이지를 호스팅해서 iframe으로?"

**결과: ❌ 실패.** `_` 프리픽스 이슈 + Pages 배포 stuck. 게다가 iframe cross-origin 문제.

## 3. 빈틈 — 자동화는 불가능, 그럼 어떻게?

### 발견한 것

**5번의 시도, 5번의 실패. 하지만 이 과정에서 결정적인 걸 깨달았다:**

1. **틱스토리 Open API는 영원히 죽었다** (2024.2 종료, 부활 계획 없음)
2. **Android는 자동화에 적대적이다** (sandbox + SecurityException + 북마크릿 차단)
3. **하지만 RSS는 살아있다** — `/rss`로 제목·날짜·요약·링크 전부 파싱 가능
4. **HTML 모드는 JS를 막지만 CSS는 다 통과시킨다** — XSS 필터가 유일한 적

### Boss의 전략적 전환 (§44, 2026-07-25)

> "틱스토리랑 네이버는 기를 쓰고 뚫을 필요 없다. API 죽었고, 안티봇에 막힌다. 여기는 사람이 직접 한다."

**여기서 패러다임이 바뀌었다:**
- 자동화(automation) → **사람+AI 협업(Paste Pipeline)**
- 뚫기(hacking) → **우회(workaround)**
- 기계 발행 → **사람의 복사+붙여넣기**

## 4. 솔루션 — 5단계 진화

### Phase 1: Paste Pipeline (§44)

```
Claude Code가 원고 작성 → TG로 Boss에게 배달 → Boss가 복사+붙여넣기 → 발행 (5분)
```

핵심: API 없어도 되는 이유 — **사람이 최종 5분만 투자하면 AI가 앞의 55분을 다 해낸다.**

### Phase 2: RSS 역방향 리마인더 (§67-69)

> "내가 어디까지 했는지 RSS로 파싱해서 Boss에게 알려줄 수 있다"

```
① Boss가 티스토리에 업무수첩 발행
② Claude Code가 RSS 파싱 → 제목·날짜·링크 수집
③ Boss에게 "여기까지 했습니다" 리마인더
```

**발견:** 티스토리 RSS는 제목·날짜·요약·링크 모두 자동 파싱 가능. Boss가 쓴 글 제목만 봐도 전체 작업 이력이 한눈에.

### Phase 3: 5명의 기자 모델 (§52-53)

```
5개 티스토리 = 5명의 기자
각 기자가 자기 분야(IT·돌봄·음악·신앙·자유)의 기사를 발행
→ RSS로 GitHub(helana_log/기자/)에 자동 동기화
→ GitHub Pages가 "편집국" 역할
```

### Phase 4: 이중 칠판 모델 (§59, §64)

| 칠판 | 플랫폼 | 보여주는 것 |
|------|--------|------------|
| **칠판 A** | Naver·Tistory | 백서·원칙·구조·AI가 정리한 사고 |
| **칠판 B** | GitHub Pages | 대시보드·도구·PWA·인터랙티브 실행 |

Boss가 YouTube에서 두 칠판을 오가며 설명 → 콘텐츠 완결.

### Phase 5: Log → Tistory HTML 자동 파이프 (§106, 2026-08-09)

```
helana_log에 .md push
  → GitHub Actions 트리거
  → parksy_to_html.py 변환 (화자감지·SVG·CSS 그래프·필터·아코디언)
  → @helana_logbot이 Telegram으로 HTML 파일 전송
  → Boss가 파일 열기 → 전체 복사 → Tistory HTML 모드 붙여넣기
```

**기술 한도 (Tistory HTML 모드):**

| 가능 ✅ | 불가 ❌ |
|---------|---------|
| `<details>` 아코디언 | `<script>` 태그 |
| SVG 인라인 (사고지도·결정트리) | `onclick` 등 모든 이벤트 핸들러 |
| CSS 애니메이션·`:target`·`:checked` | `javascript:` URL |
| Grid·Flexbox·`@keyframes` | `<iframe>` |
| `<style>` 태그 (글 본문 내) | 외부 JS 로딩 |

## 5. 다음 — 5단 콘텐츠 라이프사이클

```
ParksyCapture(캡처)
  → parksy_to_html.py(변환)
  → Tistory HTML 발행(기자)
  → tistory_sync.sh(RSS → GitHub 동기화)
  → GitHub Pages 칠판보드(출판)
  → YouTube 튜토리얼 녹화
  → Naver 퀼트(최종 전시)
```

**숫자로 보는 시행착오:**
- 5회 자동화 시도 → 전부 실패
- 1회 패러다임 전환 (자동화→Paste Pipeline)
- 18일간의 시행착오 → 최종 자동 파이프 완성
- 5개 티스토리 기자 + RSS 동기화 + HTML 자동 변환
- 0줄의 JavaScript — 전부 CSS+SVG+HTML5만으로

## 6. 핵심 교훈

1. **API가 죽었어도 포기하지 마라.** Paste Pipeline이라는 더 나은 대안을 찾았다.
2. **XSS 필터는 적이 아니다.** JS를 막아도 CSS+SVG로 거의 모든 인터랙션이 가능하다.
3. **사람 5분 + AI 55분 = 자동화 60분.** 똑같은 결과, 다른 접근.
4. **RSS는 살아있는 마지막 API다.** 티스토리에서 유일하게 신뢰할 수 있는 데이터 통로.
5. **시행착오 자체가 콘텐츠다.** 5번의 실패 이력이 하나의 완결된 이야기가 됐다.
