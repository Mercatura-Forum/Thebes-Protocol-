#!/bin/bash
# Verify every on-chain demo link in this repo's markdown actually serves.
#
# A "live" link must return HTTP 200 with real HTML — a boundary answers 200
# with a "canister not found" body for canisters that don't exist, so a status
# check alone is NOT enough. Chain re-genesis retires canister ids; any doc
# that hardcodes one must re-run this before it ships.
#
# Usage: scripts/verify-live-links.sh   (from the repo root; exit 0 = all live)
set -u
FAIL=0
for u in $(grep -rhoE "https://memphis\.mercaturaforum\.com/_/raw/[0-9]+/[A-Za-z0-9._-]+" --include="*.md" . | sort -u); do
  BODY=$(curl -sS -m 15 "$u" || true)
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -m 15 "$u" || echo 000)
  NF=$(printf '%s' "$BODY" | grep -ci "canister not found" || true)
  HTML=$(printf '%s' "$BODY" | head -c 200 | grep -ci "<!doctype\|<html" || true)
  if [ "$CODE" = "200" ] && [ "$NF" = "0" ] && [ "$HTML" -ge 1 ]; then
    echo "OK   $u"
  else
    echo "DEAD $u (http=$CODE notfound=$NF html=$HTML)"
    FAIL=1
  fi
done
exit $FAIL
