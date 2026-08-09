---
date: 2026-08-09
source: comprehensive
agent: Claude
---

# ParksyCapture 백서 — AI 대화를 지식 자산으로

> **부제:** 왜 우리는 AI와의 대화를 캡처하고, 구조화하고, 발행하는가
> **버전:** v1.0 · 2026-08-09
> **대상:** Tistory 마크다운 모드 발행용

---

## 개요 — 이게 뭔가

ParksyCapture(`com.parksy.capture`)는 Flutter 기반 Android 앱이다. Claude·Grok·ChatGPT 같은 AI 앱과의 대화를 Share Intent로 캡처해 마크다운 파일로 저장한다. 단순한 "캡처 도구"가 아니라, AI 시대 지식 관리 파이프라인의 첫 관문이다.

**핵심 명제:** AI와의 대화는 휘발성이다. ParksyCapture는 그 휘발성 대화를 영구 지식 자산으로 전환하는 인터페이스다.

### 앱 스펙

| 항목 | 값 |
|------|-----|
| 패키지명 | `com.parksy.capture` |
| 용량 | 183MB (Flutter fat APK) |
| 프레임워크 | Flutter + Dart VM |
| 저장 경로 | `/sdcard/Download/parksy-logs/ParksyLog_*.md` |
| 출력 형식 | YAML frontmatter + 마크다운 |

---

## 작동 원리 — 3단계로 이해하는 흐름

### 1단계: 캡처 (Capture)

```
사용자가 Claude/Grok 앱에서 대화 중
        │
        ▼
"공유" 버튼 탭 → Android Share Sheet
        │
        ▼
ParksyCapture 선택
        │
        ▼
ACTION_SEND intent 수신
  EXTRA_TEXT = 전체 대화 내용 (텍스트)
  EXTRA_STREAM = 이미지 URI (현재 미처리)
        │
        ▼
Flutter Dart 코드가 텍스트 정제
  - 중복 라인 제거
  - YAML frontmatter 추가 (날짜, source)
  - 마크다운 구조 유지
        │
        ▼
/sdcard/Download/parksy-logs/
  ParksyLog_20260725_080708.md
```

### 2단계: 저장 (Store)

캡처된 `.md` 파일은 두 경로로 저장된다:

1. **로컬:** `/sdcard/Download/parksy-logs/` (폰 내부)
2. **원격:** `helana_log/logs/` (GitHub, 수동 push)

이중 저장이 중요한 이유: 폰을 잃어버려도 GitHub에 모든 대화가 남아있다. 플랫폼 독립적.

### 3단계: 발행 (Publish)

```
helana_log/logs/*.md
        │
        ├─→ (자동) GitHub Actions 트리거
        │      └─→ log_to_telegram.sh
        │             ├─→ 기본: .md 그대로 Telegram 전송
        │             │      └─→ Boss 복사 → Tistory 마크다운 모드
        │             └─→ --html: HTML 변환 후 전송  
        │                    └─→ Boss 복사 → Tistory HTML 모드
        │                           (아코디언·SVG·CSS 애니메이션 포함)
        │
        └─→ (자동) tistory_sync.sh
               └─→ Tistory RSS → helana_log/기자/ 동기화
                      └─→ GitHub Pages 칠판보드 출판
```

---

## 왜 필요한가 — AI 시대 지식 관리의 역설

### AI와 대화할수록 지식은 더 빨리 사라진다

AI 어시스턴트와의 대화는 생산적이다. 한 세션에서 수십 개의 결정, 분석, 아이디어가 오간다. 하지만:

- **채팅 인터페이스는 휘발성이다.** 스레드가 길어지면 컨텍스트 윈도우 밖으로 밀려난다
- **새 세션 = 리셋.** 이전 대화의 판단 근거가 사라진다
- **검색 불가.** "그때 그 결정 왜 했더라?"를 찾을 수 없다
- **암묵지의 함정.** 내 머릿속에만 있고, 남에게 설명할 수 없다

### ParksyCapture가 메꾸는 4가지 구멍

| 없을 때 | 있을 때 |
|---------|---------|
| **판단 소실:** "왜 그렇게 했는지" 사라짐 | 질문→반박→수정→결정 전 과정 보존 |
| **기억 왜곡:** 며칠 지나면 기억이 흐려짐 | 타임스탬프 + 원본 텍스트로 정확한 복기 |
| **전수 불가:** 나만 아는 암묵지 | 대화록 자체가 교재 — 사고 흐름이 보임 |
| **검색 불가:** "어디에 적었더라?" | GitHub grep = 모든 대화 full-text 검색 |

---

## 지식 3층 구조 — 날것에서 발행까지

ParksyCapture가 있음으로써 가능해진 지식의 층위:

```
┌─────────────────────────────────────────────┐
│ Layer 3 — 발행 (Published)                   │
│ Tistory HTML · GitHub Pages · YouTube · Naver │
│ "찾아서 배울 수 있는" 층                      │
├─────────────────────────────────────────────┤
│ Layer 2 — 정제 (Refined)                     │
│ Fact/Feel/Gap/Fix/Next 구조화된 대화록        │
│ "읽으면 이해되는" 층                          │
├─────────────────────────────────────────────┤
│ Layer 1 — 날것 (Raw)                         │
│ ParksyCapture 로그 · 스크린샷 · 음성 메모     │
│ "있기만 해도 가치 있는" 층                    │
└─────────────────────────────────────────────┘
```

**3층이 다 있어야 지식이 산다.** Layer 3만 있으면 과정이 안 보인다. Layer 1만 있으면 검색이 안 된다.

---

## 기술 아키텍처 — APK 내부 구조

S21 실기기에서 `pm path` + `unzip`으로 추출한 실제 구조:

### 핵심 컴포넌트

```
base.apk (183MB)
├── lib/arm64-v8a/
│   ├── libflutter.so         39.8MB  ← Flutter 렌더링 엔진
│   ├── libVkLayer_*.so       13.2MB  ← Vulkan GPU 검증 레이어
│   └── libdatastore_*.so      7.1KB  ← 로컬 설정 저장소
├── assets/flutter_assets/
│   ├── kernel_blob.bin       40.6MB  ← 전체 Dart 앱 코드
│   ├── isolate_snapshot_data 10.5MB  ← Dart 실행 상태
│   └── MaterialIcons.otf      1.6MB  ← 머티리얼 아이콘 폰트
├── classes.dex               10.3MB  ← Java/Kotlin 브릿지 코드
├── classes[2-8].dex           0.6MB  ← AndroidX·Share·I/O 핸들러
└── res/                              ← Android 리소스 (564 애니메이션·레이아웃)
```

### 핵심 AndroidX API

| 라이브러리 | 역할 |
|-----------|------|
| `datastore` | 앱 설정·환경설정 영구 저장 |
| `activity` | Share Intent 수신 (`ACTION_SEND`) |
| `documentfile` | 공유 저장소 파일 접근 (SAF) |
| `lifecycle` | 앱 수명주기·백그라운드 처리 |
| `browser` | 브라우저 연동 (URL 열기 등) |

---

## 실제 운영 데이터

### 현재까지 캡처된 유일한 파일

```
/sdcard/Download/parksy-logs/
  └── ParksyLog_20260725_080708.md (7,929 bytes)
      ├── date: 2026-07-25 08:07:08
      ├── source: android-share
      └── 내용: Boss-Grok 토큰 보안 논의 + 이미지 캡처 한계 분석
```

### UID 분석

파일 소유자 UID = `10264`. Android 앱 샌드박스 전용 사용자. proot Ubuntu(UID 0/root)에서는 읽기만 가능, 쓰기는 불가. 이 말은 **ParksyCapture만 이 디렉토리에 쓸 수 있다**는 뜻 — 파이프라인 연동 시 읽기 전용 접근으로 충분.

---

## 한계와 개선 방향

### 현재 한계

| 항목 | 상태 | 영향 |
|------|------|------|
| 이미지 캡처 | ❌ `EXTRA_STREAM` 미처리 | Claude CDN 이미지 누락 |
| 자동 push | ❌ 수동 git only | 캡처 → 발행 사이 사람 개입 필요 |
| 토큰 필터링 | ❌ 없음 | `ghp_`·`sk-` 등 민감 문자열 마스킹 안 됨 |
| 저장 경로 | 고정 | 설정에서 변경 불가 |
| 앱 용량 | 183MB | Flutter fat APK, 최적화 여지 큼 |

### 개선 로드맵

1. **단기:** Termux `inotifywait`으로 `/sdcard/Download/parksy-logs/` 감시 → 새 파일 생기면 자동 git add+commit+push
2. **중기:** ParksyCapture에 `EXTRA_STREAM` 이미지 URI 핸들러 추가 (강박사 협업)
3. **장기:** APK 경량화 (ABI별 분리 빌드 → arm64-only = ~90MB)

---

## 사용 설명서 — 30초 가이드

### 설치
1. APK 다운로드 ([추후 Play Store 또는 GitHub Releases])
2. Android "출처를 알 수 없는 앱" 허용
3. 설치 완료 → 특별한 설정 불필요

### 캡처 방법
1. Claude·Grok·ChatGPT 앱에서 대화 중
2. 우측 상단 ⋮ → **공유**
3. 공유 대상 목록에서 **ParksyCapture** 선택
4. 끝. 자동으로 `.md` 파일 생성됨

### 발행 방법 (표준 파이프라인)
1. 캡처된 `.md` 파일을 `helana_log/logs/`에 git push
2. GitHub Actions 자동 트리거 → Telegram `@helana_logbot`으로 전송
3. Telegram에서 PART 1~N 순서대로 복사
4. Tistory 글쓰기 → **마크다운 모드** → 붙여넣기 → 발행
5. (선택) HTML 모드가 필요하면 `--html` 플래그 사용

### 파일 위치
- **폰:** `/sdcard/Download/parksy-logs/ParksyLog_*.md`
- **GitHub:** `helena751107/helana_log/logs/`
- **Telegram:** `@helana_logbot`

---

## 생태계 내 위치 — 전체 지식 파이프라인

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│ CAPTURE │ →  │  STORE   │ →  │ REFINE   │ →  │ CONVERT  │ →  │PUBLISH  │
│ Parksy  │    │helana_log│    │ Boss+AI  │    │parksy_to │    │Tistory  │
│Capture  │    │  /logs/  │    │  검토    │    │_html.py  │    │GitHub   │
│         │    │          │    │          │    │          │    │YouTube  │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    │Naver    │
     ↑                                                        └─────────┘
     │                                              │
     └──────────── RSS 순환 ────────────────────────┘
            (tistory_sync.sh → helana_log/기자/)
```

**ParksyCapture는 이 전체 파이프라인의 시작점이다.** 이 앱 없이는 어떤 대화도 기록되지 않고, 기록되지 않은 대화는 지식이 될 수 없다.

---

## 결론 — 한 줄 요약

> **ParksyCapture는 "생각의 스크린샷" 도구다.**
> 
> 코드를 찍는 스크린샷이 아니라, AI와의 사고 흐름을 찍는 도구.
> 그 스크린샷(마크다운 로그)이 3층 구조(날것→정제→발행)를 거쳐
> 검색 가능하고, 재사용 가능하고, 발행 가능한 지식 자산이 된다.
> 
> AI와 일하면서 저장 버튼을 누르지 않는 것은,
> 저장 버튼 없는 워드프로세서로 글을 쓰는 것과 같다.
> 결과물은 있지만, 어떻게 거기에 도달했는지는 영원히 사라진다.
> 
> **그리고 AI 시대에 "어떻게 도달했는가"는 "무엇을 만들었는가"만큼 중요하다.**
> 왜냐하면 더 나은 질문을 하기 위한 재료이기 때문이다.
