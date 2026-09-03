#!/usr/bin/env bash
set -euo pipefail

: "${API_URL:?Set API_URL, e.g. https://personal-gemini-journal-api-xxxxx-uc.a.run.app}"
: "${FIREBASE_ID_TOKEN:?Set FIREBASE_ID_TOKEN from Firebase Auth getIdToken()}"

curl -sS "$API_URL/health"
echo

curl -sS "$API_URL/api/gemini/reflect" \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"Help me reflect on why I keep delaying an important decision.",
    "history":[],
    "mode":"reflect",
    "entryContext":"I have been thinking about changing direction on a project."
  }'
echo
