#!/bin/bash
# helana_log 전용 텔레그램 보고 스크립트
# 사용법: bash scripts/tg.sh "메시지"
# 환경변수: HELANA_LOG_TG_TOKEN, HELANA_LOG_TG_CHAT

TOKEN="${HELANA_LOG_TG_TOKEN:-}"
CHAT="${HELANA_LOG_TG_CHAT:-}"

if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
  echo "❌ HELANA_LOG_TG_TOKEN 또는 HELANA_LOG_TG_CHAT 미설정" >&2
  exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d chat_id="$CHAT" \
  -d text="$*" \
  -w "\n%{http_code}" 2>/dev/null | tail -1
