# S21 가창 AI 파이프라인 — Exynos NPU 가속 솔루션
**작성: 2026-08-14 | Helena S21 전용 가창 머신**

> 저작권 만료 악보(.ustx) → DiffSinger 보이스뱅크 → helena RVC 음색 → MP3
> REAPER 불필요. Python headless 완전 자동화.

---

## 커뮤니티 리서치 결론 (2026-08-14)

### Exynos 2100 NPU 접근 경로별 판정

| 경로 | 가능 여부 | 이유 |
|------|----------|------|
| proot pip onnxruntime NNAPI | ❌ 불가 | Linux ARM64 빌드 = NNAPI EP 코드 없음 |
| Termux native pip onnxruntime NNAPI | ❌ 불가 | 동일 이유 (Linux 빌드) |
| Maven AAR onnxruntime-android | ⚠️ 조건부 | Android NDK 빌드 .so 추출 → Python ctypes |
| DiffSingerMiniEngine C++ ARM64 | ✅ 가능 | NDK 컴파일 → Termux native 실행, 가장 강력 |
| fp16 CPU (ARM NEON) | ✅ 즉시 | 검증됨 (RTF 2.51x→1.67x, S25 기준) |

### DiffSinger 아키텍처 vs NNAPI 호환성

```
Acoustic Encoder (NNAPI 친화)
├── Embedding          ✅ 지원
├── LayerNorm          ⚠️ 부분 지원
└── Linear/FFN         ✅ 지원

Diffusion Decoder (NNAPI 불가)
├── Sin/Cos (위치인코딩) ❌ 미지원 → CPU fallback
├── CumSum             ❌ 미지원
└── Denoising loop     ❌ 동적 연산
```

**결론**: diffusion decoder가 병목 → RVC와 동일한 파티셔닝 오버헤드 문제.
steps 줄이기 + fp16이 NPU보다 현실적 단기 해법.

---

## 3단계 솔루션

### Stage 1 — 즉시 (오늘): fp16 + thread 최적화

설치:
```bash
# proot Ubuntu에서
~/browser-env/bin/pip install onnxruntime soundfile mido
```

실행:
```bash
~/browser-env/bin/python3 ~/helena_phone/scripts/singing/s21_singing.py \
  --lyrics "주 나를 사랑" \
  --notes "C4,E4,G4,C5" \
  --durs "0.5,0.5,0.5,1.0" \
  --steps 10 \
  --rvc
```

예상 성능 (30초 가창):
- DiffSinger steps=10, fp16: ~60초
- NSF-HiFiGAN: ~10초
- helena RVC: ~3분
- 총: ~4~5분 → 배치 OK

---

### Stage 2 — 단기 (1주): DiffSingerMiniEngine ARM64 빌드

S21 Termux native에서 C++ 엔진 직접 실행. NNAPI 접근 가능.

```bash
# Termux (proot 아님)에서 NDK 설치
pkg install clang cmake

# onnxruntime Android build (NNAPI 포함)
wget https://repo1.maven.org/maven2/com/microsoft/onnxruntime/onnxruntime-android/1.17.3/onnxruntime-android-1.17.3.aar
unzip onnxruntime-android-1.17.3.aar jni/arm64-v8a/libonnxruntime.so -d /tmp/ort_android/

# DiffSingerMiniEngine 클론 + 빌드
git clone https://github.com/openvpi/DiffSingerMiniEngine
cd DiffSingerMiniEngine
# CMakeLists.txt에 ONNXRUNTIME_ROOT 지정 후 빌드
cmake -DONNXRUNTIME_ROOT=/tmp/ort_android .
make -j4
```

빌드 완료 시 NNAPI EP로 acoustic encoder 가속 가능.
예상: encoder RTF 0.3~0.5x (2~3배 빠름)

---

### Stage 3 — 중기 (2주): helena RVC 음색 통합

Stage 1 완료 후 helena 보이스뱅크 파이프라인:

```
저작권만료 악보 (.ustx / MIDI)
         ↓
 DiffSinger PARKSY_DS (박씨 음색으로 합창)
         ↓
 helena_rvc.pth (helena 음색으로 변환)
         ↓
 마스터링 (loudnorm -14LUFS)
         ↓
 helena_cover_{곡명}.mp3
```

helena_rvc 파라미터 (검증값):
```python
f0_up_key=0          # 음정 유지
f0_method='rmvpe'    # 최고품질 F0
index_rate=0.75      # 음색 강도
resample_sr=40000    # 리샘플링
```

---

## 파일 위치

| 파일 | 경로 |
|------|------|
| 메인 파이프라인 | `~/helena_phone/scripts/singing/s21_singing.py` |
| NPU 가용성 진단 | `~/helena_phone/scripts/singing/check_npu.sh` |
| 보이스뱅크 | `~/.local/share/OpenUtau/Singers/PARKSY_DS/` |
| helena RVC | `~/helena_phone/rvc/helena_rvc.pth` |
| helena RVC index | `~/helena_phone/rvc/helena_rvc.index` |

---

## 보이스뱅크 선택 기준

| 보이스뱅크 | 언어 | 추천 용도 | 현재 상태 |
|-----------|------|---------|---------|
| PARKSY_DS | 한국어 | 찬송가/가스펠 | ✅ 즉시 사용 |
| SPORE | 영어 | 영어 찬송가 | ⚠️ venv 분리 필요 |
| Allen Crow | 영어다국어 | 영어 다국어 | ⚠️ 동일 |

helena_rvc 후처리로 어떤 보이스뱅크든 helena 음색으로 변환 가능.

---

*작성: 2026-08-14 | 커뮤니티 리서치 기반 S21 가창 AI 솔루션*
*참조: infra-history/24 (S25 RVC 실구동), infra-history/26 (ONNX NPU 하이브리드)*
