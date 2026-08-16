---
id: "10"
type: solution
title: "보고 무전기 — 이상을 어떻게 알리는가 (텔레그램)"
question: "감지한 이상을 어떻게 보고하는가"
answer: "send_alert가 등급(urgent/warning/info)별 아이콘과 함께 텔레그램으로 즉시 발송하고, 긴급 시 2차 수신자에게 에스컬레이션하며, 매시 정각 근처에 정기 보고를 남긴다"
category: "보고 무전기"
category_id: 1307312
track: ""
sources:
  - helena_phone:care/care-daemon.sh
  - helena_phone:care/care.conf
interactive:
  - report-flow
  - report-levels
date: "2026-08-16"
민감정보: "없음"
---

# 보고 무전기 — 이상을 어떻게 알리는가 (텔레그램)

> 앞선 편들이 감시(배터리·온도·위치)와 통로(원격망)를 다뤘다면, 이 편은 **그 숫자들을 사람에게 전달하는 마지막 단계**다. 데몬이 아무리 잘 감지해도, 아무에게도 안 들리면 무의미하다. 보고 무전기는 텔레그램이다.

## 1. 질문

감지한 이상을 어떻게 보고하는가.

한 줄로: 감지 단계가 만든 **등급(level)** 을 받아, `send_alert`가 텔레그램으로 즉시 발송하고, 긴급이면 2차 수신자에게 에스컬레이션하며, 이상이 없어도 매시 정각 근처에 정기 보고를 남긴다.

## 2. 원리

보고는 **등급 주도**로 흐른다. 분석 단계(편 07·08)가 `level`을 `info` → `warning` → `urgent`로 올려두면, 보고 단계가 그 등급대로 행동한다.

- **urgent / warning** — 이상이 있으므로 **즉시** 발송. 알림 본문에는 걸린 이상들(배터리·온도·GPS)과 함께 **위치·배터리·WiFi·셀룰러** 현황을 한 번에 실어 보낸다.
- **urgent 이면 에스컬레이션** — 1차 수신자(헬레나)뿐 아니라 2차 수신자(목사님, `TG_CHAT_PASTOR` 설정 시)에게도 "[에스컬레이션]" 표지를 달아 보낸다.
- **이상이 없어도 정기 보고** — 매시 정각 근처(분 ≤ 5)에 `info` 등급의 정기 보고를 남긴다. 이게 일종의 **하트비트**다. 정기 보고가 안 온다 = 데몬이 죽었다는 신호다.

보고의 신뢰성은 **"안 오면 죽은 것"** 이라는 역발상에 있다. 정기 보고를 주기적으로 남기므로, 그게 끊기면 데몬·네트워크 어딘가가 죽었다는 뜻이다(편 09의 워치독 설계와 연결).

## 3. 실물 (코드·설정)

`send_alert`가 등급별 아이콘을 붙이고 텔레그램 API로 발송한다.

```bash
send_alert() {
  local level="$1" msg="$2" target="${3:-$TG_CHAT_HELENA}"
  local icon
  case "$level" in
    urgent)  icon="🔴" ;;
    warning) icon="🟡" ;;
    info)    icon="🟢" ;;
    *)       icon="📢" ;;
  esac
  curl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -d "chat_id=${target}" \
    -d "text=${text}" \
    -d "disable_notification=${DISABLE_NOTIFY:-false}" >/dev/null 2>&1
}
```

보고는 등급에 따라 갈린다(즉시 + 에스컬레이션 + 정기).

```bash
if [ "$ALERT_LEVEL" = "urgent" ] || [ "$ALERT_LEVEL" = "warning" ]; then
  send_alert "$ALERT_LEVEL" "$report" "$TG_CHAT_HELENA"
  # 긴급 시 2차 수신자에게도
  if [ "$ALERT_LEVEL" = "urgent" ] && [ -n "${TG_CHAT_PASTOR:-}" ]; then
    send_alert "urgent" "[에스컬레이션] $report" "$TG_CHAT_PASTOR"
  fi
fi
# 정기 보고 (매시 정각 ±5분)
if [ "$min" -le 5 ]; then send_alert "info" "$report" "$TG_CHAT_HELENA"; fi
```

```care type="flow" id="report-flow"
title: 보고 흐름 — 등급 → 즉시 발송 → 에스컬레이션 / 정기
nodes:
  - { id: level, label: "분석 결과 (level)", kind: start }
  - { id: send, label: "즉시 발송 (헬레나)" }
  - { id: esc, label: "에스컬레이션 (목사님)" }
  - { id: regular, label: "정기 보고 (매시)" }
edges:
  - { from: level, to: send, label: "urgent/warning 시" }
  - { from: send, to: esc, label: "urgent면" }
  - { from: esc, to: regular }
```

## 4. 등급 (임계값 아님 — 보고 등급)

보고는 임계값이 아니라 **등급 3단계**로 움직인다. 아이콘·수신처가 등급에 따라 달라진다.

```care type="threshold-table" id="report-levels"
title: 보고 등급 3단계 (send_alert)
rows:
  - { label: "urgent 🔴", threshold: "방전·급감·무변동", action: "즉시 + 2차 수신자 에스컬레이션", level: urgent }
  - { label: "warning 🟡", threshold: "과열·GPS 무응답·WiFi 약함", action: "즉시 발송 (1차만)", level: warning }
  - { label: "info 🟢", threshold: "이상 없음 (매시 정각)", action: "정기 보고 (하트비트)", level: info }
```

## 5. 한계·확인 창구

- **텔레그램은 폰 네트워크에 의존한다.** 셀룰러·와이파이가 모두 끊기면 보고도 안 간다. 데몬은 로컬 로그(`care.log`)에 남기지만, 그 순간엔 원격으로 볼 수 없다.
- **정기 보고 끊김 = 데몬 죽음의 신호지만, 감지 자체는 아직 설계 단계다.** "정기 보고가 N시간 안 오면 경고"라는 워치독은 아직 코드에 없다(편 09 한계와 연결된 다음 단계).
- **토큰·채팅 ID는 공개하지 않는다.** `TG_TOKEN`·`TG_CHAT_*`은 `.secrets.env`·`care.conf`에 있고, 절대 커밋·게시하지 않는다. 이 원고는 보고 형식만 보여준다.
- **법령·의료 단정 금지:** 텔레그램 보고는 알림이지 의료·돌봄 판단이 아니다. 실제 조치는 사람이, 필요하면 보건소·의료기관·119에서 할 것.

> 이 채널은 법률 자문도 의료 가이드도 아니다.
