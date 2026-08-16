---
id: "09"
type: solution
title: "원격 돌봄망 — 간병인이 '안으로' 들어오는 통로 (Tailscale)"
question: "간병인이 원격에서 어떻게 돌봄 상태를 확인하고 조치하는가"
answer: "Tailscale 단일 노드(helena-android, userspace-networking)로 인바운드 채널을 열어, 아웃바운드 보고(텔레그램)와 짝을 이루는 원격 셸·포트 통로를 확보한다"
category: "원격 돌봄망"
category_id: 1307311
track: ""
sources:
  - helena_phone:care/start-tailscale-boot.sh
  - helena_phone:care/tailscale-check.sh
  - helena_phone:care/tailscale-care-daemon_Claude.md
interactive:
  - remote-flow
  - remote-check
date: "2026-08-16"
민감정보: "없음"
---

# 원격 돌봄망 — 간병인이 '안으로' 들어오는 통로 (Tailscale)

> 지금까지 편들은 전부 데몬이 **"밖으로" 보고하는** 방향이었다(텔레그램). 하지만 돌봄은 보고로 끝나지 않는다 — 보고를 받은 간병인이 **"안으로" 들어와 조치**할 수 있어야 한다. 이 편은 그 반대 방향 통로, **원격 돌봄망(Tailscale)** 을 다룬다.

## 1. 질문

간병인이 원격에서 어떻게 돌봄 상태를 확인하고 조치하는가.

한 줄로: 돌봄 데몬은 **아웃바운드(텔레그램 보고) + 인바운드(Tailscale 원격 접속)** 두 축이고, 이 편은 그중 인바운드 축을 다룬다.

## 2. 원리

보고만 하고 손이 없으면 "수호천사"가 될 수 없다. 그래서 원격 접속이 필요하다.

문제는 S21이 **proot(glibc) 위 우분투**를 돌린다는 점이다. proot의 root는 권한(capability)이 0개라서, 일반 Tailscale이 쓰는 TUN 네트워크 장치를 만들 수 없다. 실측으로 `tstun.New: permission denied`가 떴다.

해결은 두 가지다.

- **`--tun=userspace-networking`:** TUN 장치를 만들지 않고 사용자 공간에서 네트워킹한다. 이건 선택이 아니라 **필수**다.
- **proot 제거, Termux 네이티브:** 결국 2026-08-14에 듀얼 노드(proot+Termux)를 **단일 노드(helena-android, Termux bionic 네이티브, port 41642)** 로 줄였다. glibc/bionic 겹층이 재부팅 버그의 근원이었기 때문이다. 상주 프로세스는 `tailscaled` 하나뿐이다.

userspace 모드는 `tailscale0` 인터페이스(직접 IP 접속)를 만들지 않는다. 그래서 접속은 **`tailscale ssh`(원격 셸) 또는 `tailscale serve`(포트 노출)** 로 간다. 간병인(박씨 기기)은 이 채널을 통해 원격 셸에 들어와 상태를 확인·조치한다.

접속 채널은 **단방향(박씨→S21)** 으로 ACL이 잠겨 있다. S21이 박씨 기기로 들어가는 방향은 막혀 있다 — 돌봄 방향만 연다.

## 3. 실물 (코드·설정)

부팅 시 tailscaled를 기동하는 스크립트다. `up` 명령 없이, `tailscaled.state` 파일이 노드 키를 보존해 재기동만으로 자동 재연결한다.

```bash
# start-tailscale-boot.sh — 핵심 (단일 노드, userspace-networking, port 41642)
nohup "$TS/bin/tailscaled" \
  --state="$TS_STATE" \
  --socket="$TS_SOCK" \
  --tun=userspace-networking \
  --port=41642 \
  >> "$TS_LOG" 2>&1 &
```

상태는 상주 데몬 없이, **원할 때 한 번 도는** `tailscale-check.sh`로 확인한다. 4단계 체크다.

```bash
# tailscale-check.sh — 4단계 (on-demand, 비상주)
# [1] tailscaled 프로세스 생존  (pgrep tailscaled --port=41642)
# [2] helena-android 노드 상태  (tailscale status --json: backend/online/tag/ssh)
# [3] 인바운드 채널             (박씨 기기 REDACTED@ 가시성)
# [4] (선택) API lastSeen       (TAILSCALE_API_KEY 있으면 tailnet 온라인)
```

```care type="flow" id="remote-flow"
title: 원격 돌봄망 — 인바운드 채널 흐름
nodes:
  - { id: s21, label: "S21 (helena-android)", kind: start }
  - { id: ts, label: "tailscaled (userspace, 41642)" }
  - { id: acl, label: "ACL (박씨→S21 단방향)" }
  - { id: park, label: "박씨 기기 (간병인)" }
edges:
  - { from: s21, to: ts, label: "부팅 시 기동" }
  - { from: ts, to: acl, label: "tailnet 연결" }
  - { from: acl, to: park, label: "tailscale ssh / serve" }
```

## 4. 점검 창구 (임계값 아님)

원격망은 "임계값"보다 **"살아있는지"를 4단계로 점검**한다. 결과는 `_notebook/health/tailscale-*.json`에 이력으로 남는다.

```care type="checklist" id="remote-check"
title: 원격 돌봄망 점검 4단계 (tailscale-check.sh)
items:
  - "tailscaled 프로세스 생존 (port 41642)"
  - "노드 backend Running + SSH 서버 광고 중"
  - "박씨 기기(REDACTED@) 인바운드 가시"
  - "tailnet 온라인 (API lastSeen, API 키 있을 때)"
```

## 5. 한계·확인 창구

- **userspace 모드는 직접 IP(ping) 접속이 안 된다.** `tailscale ssh`·`tailscale serve`로만 접속한다. 이 한계를 모르고 "핑이 안 돼서 죽었다"고 오판하지 말 것.
- **인증 키는 90일마다 만료된다(다음 2026-11-11).** 만료 전 재발급·갱신이 필요하다. 이건 돌봄망이 조용히 끊어질 수 있는 대표 지점이다.
- **"안 죽게"와 "죽으면 알아차리게"는 별개다.** 삼성이 극단 상황(메모리 압박)에서 앱을 죽일 수 있어, 죽음을 감지하는 하트비트/워치독이 아직 설계 단계다(편 10 보고 무전기와 연결).
- **ACL 단방향(박씨→S21)이므로,** S21에서 박씨 기기로는 들어갈 수 없다. 방향이 막힌 건 의도된 설계다.
- **법령·의료 단정 금지:** 원격 접속은 기술 통로일 뿐, 의료·돌봄 행위의 기준을 정하지 않는다. 필요하면 해당 창구에서 확인할 것.

> 이 채널은 법률 자문도 의료 가이드도 아니다.
