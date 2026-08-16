---
id: "08"
type: solution
title: "돌봄 데몬의 위치·GPS 감시 — '안 움직임'을 잡는 눈"
question: "위치를 어떻게 감시하고 움직임 없음을 잡아내는가"
answer: "termux-location(GPS 우선, 네트워크 폴백)으로 좌표를 읽어, 2시간 GPS 무응답·6시간 위치 무변동을 잡아 웰니스 체크를 촉발한다"
category: "위치·GPS"
category_id: 1307310
track: ""
sources:
  - helena_phone:care/care-daemon.sh
  - helena_phone:care/care.conf
interactive:
  - location-flow
  - location-thresholds
date: "2026-08-16"
민감정보: "없음"
---

# 돌봄 데몬의 위치·GPS 감시 — '안 움직임'을 잡는 눈

> 배터리가 "폰이 살아있는가"를 본다면, 위치는 **"사람이 움직이고 있는가"** 를 본다. 돌봄에서 가장 무서운 것은 고장이 아니라 **조용함** — 오랫동안 같은 자리, 오랫동안 신호 없음. 이 편은 그 조용함을 숫자로 잡아내는 위치 감시를 다룬다.

## 1. 질문

위치를 어떻게 감시하고 움직임 없음을 잡아내는가.

한 줄로: `termux-location`으로 **GPS 우선, 실패하면 네트워크 폴백**으로 좌표를 읽고, 두 임계값(GPS 무응답 2시간·위치 무변동 6시간)으로 "안 움직임"을 판정한다.

## 2. 원리

위치는 다른 값과 달리 **두 번 물어보는** 수집이다.

- **1순위 GPS** — `termux-location -p gps -r last`로 마지막으로 확정된 GPS 좌표를 읽는다.
- **폴백 네트워크** — GPS가 안 잡히면(실내·날씨·기기 설정) `-p network -r last`로 와이파이·기지국 기반 좌표를 읽는다.

판정도 두 갈래다.

- **무응답(GPS silence):** 좌표가 비었거나 provider가 `none`이면, 마지막으로 위치를 잡은 시각(`last_gps_time`)과 비교해 **2시간 넘게 무응답**이면 경고한다. "폰은 살아있는데 위치가 안 잡힌다" = GPS 꺼짐·권한 회수·실내 장기 체류일 수 있다.
- **무변동(no move):** 이번 좌표가 직전 좌표와 **같으면**, 마지막으로 움직인 시각(`last_move_time`)과 비교해 **6시간 넘게 같은 자리**면 urgent로 올린다. 이게 돌봄의 핵심 신호다 — 혼자 계신 분이 6시간째 같은 자리라면 확인이 필요하다.

핵심은 **"좌표 자체가 아니라 좌표의 변화"** 를 기억한다는 점이다. 직전 좌표를 `care-state.json`에 저장해두고, 이번 좌표와 비교한다.

## 3. 실물 (코드·설정)

수집은 GPS 우선, 실패 시 네트워크 폴백이다.

```bash
collect_location() {
  local loc_json
  loc_json=$(termux-location -p gps -r last 2>/dev/null \
    || termux-location -p network -r last 2>/dev/null \
    || echo '{}')
  local lat; lat=$(echo "$loc_json" | grep -o '"latitude":[0-9.]*' | grep -o '[0-9.]*' || echo "")
  local lon; lon=$(echo "$loc_json" | grep -o '"longitude":[0-9.]*' | grep -o '[0-9.]*' || echo "")
  local provider; provider=$(echo "$loc_json" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4 || echo "none")
}
```

판정은 무응답과 무변동 두 갈래다.

```bash
# ── GPS 무응답 (2시간) ──
if [ -z "$loc_lat" ] || [ "$loc_provider" = "none" ]; then
  prev_gps_time=$(echo "$PREV_STATE" | grep "LAST_GPS_TIME=" | cut -d= -f2 || echo "$NOW_EPOCH")
  gps_gap=$(( (NOW_EPOCH - prev_gps_time) / 3600 ))
  if [ "$gps_gap" -gt "$GPS_SILENT_HOURS" ]; then
    [ "$level" = "info" ] && level="warning"; alerts="${alerts} 📍 GPS ${gps_gap}시간째 무응답"
  fi
fi

# ── 위치 무변동 (6시간) ──
prev_loc=$(echo "$PREV_STATE" | grep "LOC_LAT=" | cut -d= -f2 || echo "")
if [ -n "$prev_loc" ] && [ -n "$loc_lat" ] && [ "$prev_loc" = "$loc_lat" ]; then
  prev_move_time=$(echo "$PREV_STATE" | grep "LAST_MOVE_TIME=" | cut -d= -f2 || echo "$NOW_EPOCH")
  still_hours=$(( (NOW_EPOCH - prev_move_time) / 3600 ))
  if [ "$still_hours" -gt "$NO_MOVE_HOURS" ]; then
    level="urgent"; alerts="${alerts} 🛑 ${still_hours}시간째 위치 변동 없음 (웰니스 체크 필요)"
  fi
fi
```

```care type="flow" id="location-flow"
title: 위치 감시 흐름 — GPS→폴백 → 무응답·무변동 판정 → 보고
nodes:
  - { id: gps, label: "GPS 좌표", kind: start }
  - { id: net, label: "네트워크 폴백" }
  - { id: silent, label: "무응답 > 2시간?" }
  - { id: still, label: "무변동 > 6시간?" }
  - { id: report, label: "보고 (텔레그램)" }
edges:
  - { from: gps, to: net, label: "GPS 실패 시" }
  - { from: net, to: silent }
  - { from: silent, to: still }
  - { from: still, to: report, label: "하나라도 걸리면" }
```

## 4. 임계값

실제 `care.conf`에 박힌 값들이다.

```care type="threshold-table" id="location-thresholds"
title: 위치·GPS 임계값 (care.conf)
rows:
  - { label: "GPS 무응답", threshold: "2시간", action: "🟡 무응답 보고 (warning)", level: warning }
  - { label: "위치 무변동", threshold: "6시간", action: "🔴 웰니스 체크 (urgent)", level: urgent }
  - { label: "평소 반경", threshold: "500m", action: "선언만 됨 (미배선 — 아래 한계)", level: warning }
```

## 5. 한계·확인 창구

- **평소 반경 500m는 미구현이다.** `care.conf`에 `LOCATION_RADIUS_M=500`("평소 반경")이 **선언되어 있지만, `analyze()`에는 그 값을 쓰는 코드가 없다.** "평소 반경을 벗어나면 보고"는 아직 동작하지 않는다. 다음 단계의 과제다(편 06의 한계에서 예고한 지점).
- **좌표는 "같은 자리"만 본다.** 어느 자리인지(집·병원·산책로)는 판정하지 않는다. 좌표 변화가 있으면 "움직였다"로 본다.
- **GPS 정확도는 환경에 따라 다르다.** 실내·고층·날씨에 따라 수십~수백 m 오차가 날 수 있다. "6시간 무변동" 판정은 이 오차 범위 안의 움직임을 못 잡을 수 있다.
- **실 GPS 좌표는 공개하지 않는다.** 이 데몬은 좌표를 텔레그램 보고에 싣지만, 이 채널(원고)은 좌표·주소·동선을 절대 싣지 않는다. 돌봄 데이터 공개 금지 원칙.
- **법령·의료 단정 금지:** "6시간 무변동"은 웰니스 확인 신호이지 의학적 판단이 아니다. 필요하면 보건소·의료기관·119에서 확인할 것.

> 이 채널은 법률 자문도 의료 가이드도 아니다.
