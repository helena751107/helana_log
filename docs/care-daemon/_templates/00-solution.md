---
id: "06"
type: solution
title: ""
question: ""
answer: ""
category: "아키텍처"        # ← 06:아키텍처 / 07:배터리·온도 / 08:위치·GPS / 09:원격 돌봄망 / 10:보고 무전기
category_id: 1307308       # ← 1307308~1307312
track: ""
sources:
  - helena_phone:care/care-daemon.sh   # ← 인용할 실제 스크립트/설정
  - helena_phone:care/care.conf
interactive: []
date: ""
민감정보: "없음"
---

<!-- 규격: SPEC.md §4-4. 실물 스크립트 값을 인용(임계값 15%·45°C·500m 등). 추상 금지. -->

## 1. 질문

<!-- 이 편이 푸는 질문 (frontmatter question과 동일). -->

## 2. 원리

<!-- 어떻게 동작하는가. 3줄로. -->

## 3. 실물 (코드·설정)

<!-- 실제 care-daemon.sh / care.conf 코드 발췌 + 해설. -->

```care type="flow" id="module-flow"
title: 모듈 흐름
nodes:
  - { id: collect, label: "수집", kind: start }
  - { id: analyze, label: "분석" }
  - { id: report, label: "보고" }
edges:
  - { from: collect, to: analyze }
  - { from: analyze, to: report }
```

## 4. 임계값

```care type="threshold-table" id="thresholds"
title: 임계값
rows:
  - { label: "예시 항목", threshold: "예: 15%", action: "즉시 경고", level: urgent }
```

## 5. 한계·확인 창구

<!-- 이 모듈이 못 하는 것 + 법령·의료 단정 금지(확인 창구). -->
