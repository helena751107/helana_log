---
date: 2026-08-09
source: phone-analysis
agent: Claude
---

# ParksyCapture 구조 분석 — S21 실기기에서 추출

> `com.parksy.capture` APK + 런타임 데이터를 proot Ubuntu에서 `pm`, `unzip`으로 분석.

## 1. APK 기본 정보

| 항목 | 값 |
|------|-----|
| 패키지명 | `com.parksy.capture` |
| APK 경로 | `/data/app/~~P4dB1whLrC-ijALJocMF9Q==/com.parksy.capture-9NiX55-06c6KLcT0F0cqkw==/base.apk` |
| 크기 | **183MB** |
| 파일 수 | 570개 |
| 프레임워크 | **Flutter** (Dart VM) |
| 지원 아키텍처 | arm64-v8a · armeabi-v7a · x86 · x86_64 (fat APK) |

## 2. 내부 구조 (570개 파일)

### Flutter 엔진 (핵심)
```
lib/arm64-v8a/
  libflutter.so                    39.8MB  ← Flutter 엔진
  libVkLayer_khronos_validation.so 13.2MB  ← Vulkan 검증 레이어 (GPU 디버깅)
  libdatastore_shared_counter.so    7.1KB  ← 데이터 저장소 카운터

assets/flutter_assets/
  kernel_blob.bin                  40.6MB  ← Dart 커널 (앱의 모든 Dart 코드)
  isolate_snapshot_data            10.5MB  ← Dart isolate 스냅샷
  vm_snapshot_data                 12.7KB  ← Dart VM 스냅샷
  shaders/ink_sparkle.frag         17.3KB  ← 잉크 효과 셰이더
  fonts/MaterialIcons-Regular.otf   1.6MB  ← 머티리얼 아이콘
```

### 네이티브 코드
```
classes.dex  10.3MB  ← 메인 Java/Kotlin 코드
classes2.dex  42KB   ← AndroidX Share Intent 핸들러
classes3.dex  25KB
classes4.dex  15KB
classes5.dex 110KB   ← DataStore + Preferences
classes6.dex 210KB   ← 파일 I/O + 저장소 접근
classes7.dex   2KB
classes8.dex  32KB
```

### 주요 AndroidX 라이브러리 (META-INF에서 확인)
```
androidx.datastore            ← 로컬 설정 저장
androidx.lifecycle            ← 수명주기 관리
androidx.activity             ← 액티비티 + Share Intent
androidx.browser              ← 브라우저 연동
androidx.fragment             ← 프래그먼트
androidx.documentfile         ← 문서 파일 접근
androidx.core                 ← 코어 유틸리티
```

## 3. 데이터 흐름 구조 (추론)

```
사용자가 Claude/Grok 앱에서 "공유" 버튼 탭
        │
        ▼
Android Share Sheet 열림 → ParksyCapture 선택
        │
        ▼
ACTION_SEND intent 수신 (EXTRA_TEXT = 대화 내용)
        │
        ▼
Flutter Dart 코드 실행 (kernel_blob.bin)
  ├── 텍스트 전처리 (중복 제거, 마크다운 정리)
  ├── 메타데이터 추가 (날짜, source: android-share)
  └── 파일 저장
        │
        ▼
저장 경로: /sdcard/Download/parksy-logs/ParksyLog_YYYYMMDD_HHMMSS.md
  (DocumentsFile API → 공유 저장소)
        │
        ▼
GitHub: helana_log/logs/ 로 수동 또는 연동 push
```

## 4. 실제 출력 확인

**유일한 캡처 파일:** `/sdcard/Download/parksy-logs/ParksyLog_20260725_080708.md`

- UID: 10264 (앱 전용 샌드박스 사용자)
- 크기: 7,929 bytes
- 포맷: YAML frontmatter + 마크다운 본문
- `source: android-share` — Share Intent 경로로 수신 확인

## 5. 기술적 특징

### 강점
- **Flutter 기반** — 크로스플랫폼. 동일 코드가 Android·iOS·웹에서 동작 가능
- **Vulkan 레이어 포함** — GPU 가속 가능성. Flutter Impeller 렌더러와 연관
- **Datastore 사용** — SharedPreferences보다 현대적인 로컬 저장소. 설정·캐시에 적합
- **DocumentFile API** — 공유 저장소 접근에 SAF(Storage Access Framework) 사용
- **Fat APK** — arm64·armeabi·x86·x86_64 전부 포함. 호환성 최우선

### 약점
- **183MB** — Flutter fat APK + Vulkan 레이어로 인한 대용량. 경량화 여지 있음
- **9개 dex 파일** — 멀티덱스. 메서드 수 65K 초과. ProGuard/R8 최적화 미흡 가능성
- **데이터 경로 제한적** — `/sdcard/Download/parksy-logs/` 고정. 설정 변경 불가능해 보임
- **이미지 캡처 불가** — Share Intent의 EXTRA_STREAM 미처리. Claude CDN 이미지 URI 대응 안 됨

## 6. 우리 파이프라인과의 연동 지점

```
ParksyCapture 출력 경로
  /sdcard/Download/parksy-logs/*.md
        │
        ├──→ 수동: git add → commit → push (helana_log/logs/)
        │         ⬇
        │    GitHub Actions 트리거 (log-to-tistory.yml)
        │         ⬇
        │    log_to_telegram.sh → Telegram (@helana_logbot)
        │         ⬇
        │    Boss 복사 → Tistory 마크다운 모드 발행
        │
        └──→ 미실현: 자동 git push 연동 (앱 내 GitHub API 연동 또는
              Termux inotifywait 감시 → auto-push)
```

## 7. 개선 가능 지점

| 항목 | 현재 | 개선 방향 |
|------|------|----------|
| 이미지 지원 | ❌ EXTRA_STREAM 미처리 | `EXTRA_STREAM` URI 핸들러 추가 |
| 자동 push | ❌ 수동 git | GitHub API 내장 또는 Termux 감시 연동 |
| 저장 경로 | 고정 (Download) | 설정에서 경로 선택 가능하게 |
| 파일 포맷 | YAML frontmatter + .md | 동일 포맷 유지 (우리 파이프라인과 호환) |
| 토큰 필터링 | ❌ 없음 | 민감 문자열(gpg_·sk-·xai-) 자동 마스킹 |
