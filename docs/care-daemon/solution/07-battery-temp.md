---
id: "07"
type: solution
title: "돌봄 데몬의 배터리·온도 감시 — 방전·과열을 먼저 잡는 눈"
question: "배터리와 온도를 어떻게 감시하는가"
answer: "termux-battery-status로 잔량·온도·충전상태를 읽고, 15% 저전압·45°C 과열·직전 대비 30% 급감 세 임계값으로 위험을 판정해 텔레그램으로 즉시 알린다"
category: "배터리·온도"
category_id: 1307309
track: ""
sources:
  - helena_phone:care/care-daemon.sh
  - helena_phone:care/care.conf
interactive:
  - battery-flow
  - battery-thresholds
  - battery-drop-demo
date: "2026-08-16"
민감정보: "없음"
---

# 돌봄 데몬의 배터리·온도 감시 — 방전·과열을 먼저 잡는 눈

> 이 편은 데몬이 돌보는 숫자들 중 **가장 먼저, 가장 자주** 보는 두 값 — 배터리와 온도 — 을 다룬다. 전원이 꺼지면 모든 돌봄이 멈추고, 과열은 화재·기기 손상으로 이어질 수 있다. 그래서 이 두 값은 임계값 판정의 최전선이다.

## 1. 질문

배터리와 온도를 어떻게 감시하는가.

한 줄로: `termux-battery-status` 한 번 호출로 **잔량·온도·충전상태**를 읽고, 세 임계값(저전압 15%·과열 45°C·급감 30%)으로 위험을 판정한다.

## 2. 원리

수집은 단 한 번의 호출로 끝난다. 안드로이드의 `termux-battery-status`가 JSON으로 값을 주면, 데몬은 그중 **percentage(잔량)·temperature(온도)·status(충전상태)·plugged(충전기 연결)** 네 필드만 뽑는다.

판정은 **절대 기준 두 개 + 변화 기준 한 개**다.

- **절대 기준 ① 저전압:** 잔량이 15% 아래로 떨어지면 방전 위험. 단, **충전 중(PLUGGED_AC)이면 경보를 울리지 않는다** — 이미 꽂혀 있는 폰에 "방전 위험"을 외치는 건 헛경보이기 때문이다.
- **절대 기준 ② 과열:** 온도가 45°C를 넘으면 과열 경보.
- **변화 기준 ③ 급감:** 직전 실행 때보다 **30% 이상 떨어졌으면** "배터리 급감"으로 잡는다. 40%여도 "10분 전 80%였다"면 상황이 다르다(편 06의 "숫자보다 숫자의 변화" 원칙).

이 세 판정이 하나라도 걸리면 등급(level)이 올라가고, 결과는 보고 단계(편 10)로 넘어간다.

## 3. 실물 (코드·설정)

수집은 `termux-battery-status` 하나로, 네 필드를 `grep`으로 뽑는다.

```bash
collect_battery() {
  local batt_json
  batt_json=$(termux-battery-status 2>/dev/null || echo '{}')
  local pct; pct=$(echo "$batt_json" | grep -o '"percentage":[0-9]*' | grep -o '[0-9]*' || echo "0")
  local temp; temp=$(echo "$batt_json" | grep -o '"temperature":[0-9.]*' | grep -o '[0-9.]*' || echo "0")
  local status; status=$(echo "$batt_json" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "UNKNOWN")
  local plugged; plugged=$(echo "$batt_json" | grep -o '"plugged":"[^"]*"' | cut -d'"' -f4 || echo "UNKNOWN")
}
```

판정은 세 임계값이고, 값은 `care.conf`에서 바꿀 수 있다.

```bash
# ── 저전압 (충전 중이면 헛경보 방지) ──
if [ "$batt_pct" -lt "$BATTERY_LOW" ] && [ "$batt_plugged" != "PLUGGED_AC" ]; then
  level="urgent"; alerts="${alerts} ⚠️ 배터리 ${batt_pct}% (방전 위험)"
fi

# ── 과열 ──
if [ "${batt_temp%.*}" -gt "$TEMP_HIGH" ] 2>/dev/null; then
  [ "$level" = "info" ] && level="warning"; alerts="${alerts} 🔥 온도 ${batt_temp}°C (과열)"
fi

# ── 급감 (직전 대비) ──
prev_batt=$(echo "$PREV_STATE" | grep "BATTERY_PCT=" | cut -d= -f2 || echo "100")
drop=$((prev_batt - batt_pct))
if [ "$drop" -gt "$BATTERY_DROP_PCT" ]; then
  level="urgent"; alerts="${alerts} 📉 배터리 급감: ${prev_batt}% → ${batt_pct}%"
fi
```

```care type="flow" id="battery-flow"
title: 배터리·온도 감시 흐름 — 수집 → 세 판정 → 보고
nodes:
  - { id: collect, label: "termux-battery-status", kind: start }
  - { id: low, label: "저전압 < 15%?" }
  - { id: hot, label: "과열 > 45°C?" }
  - { id: drop, label: "급감 > 30%?" }
  - { id: report, label: "보고 (텔레그램)" }
edges:
  - { from: collect, to: low }
  - { from: low, to: hot }
  - { from: hot, to: drop }
  - { from: drop, to: report, label: "하나라도 걸리면" }
```

## 4. 임계값

실제 `care.conf`에 박힌 값들이다.

```care type="threshold-table" id="battery-thresholds"
title: 배터리·온도 임계값 (care.conf)
rows:
  - { label: "배터리 저전압", threshold: "15%", action: "즉시 🔴 경고 (urgent)", level: urgent }
  - { label: "배터리 급감", threshold: "30% (직전 대비)", action: "🔴 이상 보고 (urgent)", level: urgent }
  - { label: "온도 과열", threshold: "45°C", action: "🟡 과열 경고 (warning)", level: warning }
```

급감은 "직전 값"이 있어야 의미가 있다. 아래는 60분 안에 100% → 65%로 35% 떨어진 가상 사례다(30% 기준을 넘어 urgent).

```care type="bar-chart" id="battery-drop-demo"
title: 배터리 급감 사례 (60분, 35% 하락)
bars:
  - { label: "0분 (직전)", value: 100 }
  - { label: "60분 (현재)", value: 65 }
```

## 5. 한계·확인 창구

- **숫자는 잡지만 원인은 모른다.** 데몬은 "잔량이 떨어졌다"는 결과만 안다. 어떤 앱이 배터리를 먹는지, 배터리 자체가 노화했는지는 별도 점검이 필요하다(안드로이드 설정 → 배터리 사용량).
- **온도는 배터리 온도다.** 실내 온도·체온과 다르다. 사람의 건강 상태를 의미하지 않는다.
- **급감 기준(30%)은 판정이지 예측이 아니다.** "얼마나 더 버틸지"는 이 데몬이 알려주지 않는다. 배터리 교체 시점은 기기 제조사·서비스센터에서 확인할 것.
- **법령·의료 단정 금지:** 폰의 배터리·온도 수치는 건강·복지 판단의 근거가 아니다. 필요하면 보건소·의료기관에서 확인할 것.

> 이 채널은 법률 자문도 의료 가이드도 아니다.
