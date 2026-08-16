---
id: "06"
type: solution
title: "돌봄 데몬 아키텍처 — 15분마다 도는 심장"
question: "돌봄 데몬은 어떤 구조로 돌아가는가"
answer: "crontab이 15분마다 수집(termux-api)·분석(임계값+직전 상태 비교)·보고(텔레그램) 3단을 돌리며, 직전 값을 상태 파일에 기억해 급감·무이동을 잡는 상태 저장 루프"
category: "아키텍처"
category_id: 1307308
track: ""
sources:
  - helena_phone:care/care-daemon.sh
  - helena_phone:care/care.conf
interactive:
  - flow-daemon-arch
  - thresholds
date: "2026-08-16"
민감정보: "없음"
---

# 돌봄 데몬 아키텍처 — 15분마다 도는 심장

> 앞선 편들은 돌봄 데몬이 "무엇을 돌보는가"(02·03·04)와 "하루가 어떻게 흐르는가"(05)를 다뤘다. 이 편은 그 심장이 **어떤 구조로 도는가**를 실제 스크립트를 열어서 본다. 코드는 `care/care-daemon.sh` 하나, 설정은 `care/care.conf` 하나다.

## 1. 질문

돌봄 데몬은 어떤 구조로 돌아가는가.

한 줄로: 15분마다 **수집 → 분석 → 보고** 3단을 돌고, 그 사이 **직전 상태를 기억**하는 상태 저장 루프다.

## 2. 원리

데몬은 세 단계를 무한히 반복한다.

- **수집(collect)** — `termux-api`로 배터리·위치·WiFi·셀룰러 신호를 읽는다. 네 번의 읽기로 끝난다.
- **분석(analyze)** — 두 가지 기준을 함께 검사한다. ① **임계값**(배터리 15%·온도 45°C 등)은 "지금 위험한가"를, ② **직전 상태와의 비교**는 "갑자기 나빠졌는가"(배터리 급감·위치 무변동)를 본다.
- **보고(report)** — 이상이 있으면 텔레그램으로 즉시 보내고, 긴급(urgent)이면 2차 수신자에게 에스컬레이션한다. 이상이 없으면 매시 정각 근처에 정기 보고만 남긴다.

여기서 핵심은 **"상태를 기억한다"**는 점이다. 매 실행이 끝날 때 `care-state.json`에 배터리·위치·마지막 GPS/이동 시각을 저장하고, 다음 실행이 그 값을 읽어 "직전보다 30% 이상 떨어졌는가", "6시간째 같은 자리인가"를 판별한다.

임계값이 **절대 기준**(몇 % 이하면 위험)이라면, 직전 상태는 **변화 기준**(얼마나 빨리 나빠지는가)이다. 돌봄에서 중요한 것은 숫자 자체보다 **숫자의 변화**이기 때문이다. 배터리가 40%여도 "10분 전 80%였다"면 상황이 다르다.

## 3. 실물 (코드·설정)

실행은 crontab 한 줄로 15분마다 일어난다.

```bash
# care-daemon.sh 헤더
# 실행: crontab */15 * * * * bash ~/care/care-daemon.sh
```

수집은 termux-api 네 가지 호출로 끝난다.

```bash
# ── 수집 ──
collect_battery()      { termux-battery-status 2>/dev/null || echo '{}'; }
collect_location()     { termux-location -p gps -r last ... || termux-location -p network -r last ...; }
collect_connectivity() { termux-wifi-scaninfo ... || termux-wifi-connectioninfo ...; }
collect_telephony()    { termux-telephony-deviceinfo 2>/dev/null || echo '{}'; }
```

분석은 임계값(절대)과 직전 상태(변화) 두 갈래다.

```bash
# ── 임계값 (절대 기준) ──
if [ "$batt_pct" -lt "$BATTERY_LOW" ] && [ "$batt_plugged" != "PLUGGED_AC" ]; then
  level="urgent"; alerts="${alerts} ⚠️ 배터리 ${batt_pct}% (방전 위험)"
fi
if [ "${batt_temp%.*}" -gt "$TEMP_HIGH" ]; then ... fi

# ── 직전 상태 (변화 기준) ──
prev_batt=$(echo "$PREV_STATE" | grep "BATTERY_PCT=" | cut -d= -f2 || echo "100")
drop=$((prev_batt - batt_pct))
if [ "$drop" -gt "$BATTERY_DROP_PCT" ]; then
  level="urgent"; alerts="${alerts} 📉 배터리 급감: ${prev_batt}% → ${batt_pct}%"
fi
```

상태는 `save_state`가 JSON에 쓰고, 다음 실행의 `main()` 첫 줄이 다시 읽는다.

```bash
save_state() { python3 -c "... json.dump(state, open('$STATE_FILE','w'), indent=2)"; }
PREV_STATE=$(load_state)   # main() 첫 줄 — 직전 주기의 기억을 로드
```

보고는 등급에 따라 갈린다.

```bash
# 이상 시 즉시 + 긴급 시 에스컬레이션 + 매시 정각 근처 정기 보고
if [ "$ALERT_LEVEL" = "urgent" ] || [ "$ALERT_LEVEL" = "warning" ]; then
  send_alert "$ALERT_LEVEL" "$report" "$TG_CHAT_HELENA"
  if [ "$ALERT_LEVEL" = "urgent" ] && [ -n "${TG_CHAT_PASTOR:-}" ]; then
    send_alert "urgent" "[에스컬레이션] $report" "$TG_CHAT_PASTOR"
  fi
fi
if [ "$min" -le 5 ]; then send_alert "info" "$report" "$TG_CHAT_HELENA"; fi  # 정기
```

```care type="flow" id="flow-daemon-arch"
title: 돌봄 데몬 루프 — 수집 → 분석 → 보고 → 저장 → 다음 주기
nodes:
  - { id: cron, label: "crontab */15", kind: start }
  - { id: collect, label: "수집 (termux-api)" }
  - { id: analyze, label: "분석" }
  - { id: report, label: "보고 (텔레그램)" }
  - { id: state, label: "care-state.json" }
edges:
  - { from: cron, to: collect, label: "15분마다" }
  - { from: collect, to: analyze }
  - { from: analyze, to: report }
  - { from: report, to: state, label: "저장" }
  - { from: state, to: cron, label: "다음 주기" }
```

## 4. 임계값

실제 `care.conf`에 박힌 값들이다.

```care type="threshold-table" id="thresholds"
title: 돌봄 데몬 임계값 (care.conf)
rows:
  - { label: "배터리 저전압", threshold: "15%", action: "즉시 🔴 경고 (urgent)", level: urgent }
  - { label: "배터리 급감", threshold: "30% (직전 대비)", action: "🔴 이상 보고 (urgent)", level: urgent }
  - { label: "온도 과열", threshold: "45°C", action: "🟡 과열 경고 (warning)", level: warning }
  - { label: "GPS 무응답", threshold: "2시간", action: "🟡 무응답 보고 (warning)", level: warning }
  - { label: "위치 무변동", threshold: "6시간", action: "🔴 웰니스 체크 (urgent)", level: urgent }
  - { label: "WiFi 약함", threshold: "RSSI < -80dBm", action: "🟡 연결성 보고 (warning)", level: warning }
```

> 여기에 하나 빠진 게 있다. `care.conf`에 `LOCATION_RADIUS_M=500`("평소 반경 500m")이 **선언되어 있지만, 현재 `analyze()`에는 그 값을 쓰는 코드가 없다.** 반경 밖 이탈 판정은 "선언만 되고 미구현"이다(아래 한계에서 다룬다).

## 5. 한계·확인 창구

- **미구현 임계값:** `LOCATION_RADIUS_M=500`(반경 밖 이탈)은 설정에만 있고 코드에 배선되지 않았다. "평소 반경을 벗어나면 보고"는 아직 동작하지 않는다. → 편 08(위치·GPS)에서 다룰 지점.
- **데몬은 알람이지 대리인이 아니다.** 배터리·온도·위치 같은 숫자는 잡지만, "약을 삼켰는지", "목소리가 어떤지"는 보지 못한다. 사람의 확인을 대체하지 않는다.
- **법령·의료 단정 금지:** 급여·복지·건강의 기준과 기한은 여기서 정하지 않는다. 해당 창구(주민센터·보건소·의료기관)에서 직접 확인할 것.

> 이 채널은 법률 자문도 의료 가이드도 아니다.
