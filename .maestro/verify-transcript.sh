#!/usr/bin/env bash
# Scores the transcript ScribeZero actually produced against the fixture's
# ground truth.
#
# The flow copies the transcript to the pasteboard, so this reads the exact
# text rather than inferring from a screenshot. Asserting a phrase is visible
# proves the model ran; scoring proves it ran well enough to ship.
#
# Usage: .maestro/verify-transcript.sh <simulator-udid>
set -euo pipefail
UDID="${1:?usage: verify-transcript.sh <udid>}"
EXPECTED="$(dirname "$0")/fixtures/expected.txt"
ACTUAL="$(xcrun simctl pbpaste "$UDID")"

echo "expected: $(cat "$EXPECTED")"
echo "actual:   $ACTUAL"

python3 - "$EXPECTED" <<PY
import re, sys, difflib
expected = open(sys.argv[1]).read()
actual = """$ACTUAL"""
norm = lambda s: re.findall(r"[a-z']+", s.lower())
e, a = norm(expected), norm(actual)
if not a:
    print("RESULT: FAIL - pasteboard was empty; the transcript never reached it")
    raise SystemExit(1)
ratio = difflib.SequenceMatcher(None, e, a).ratio()
print(f"word-level similarity: {ratio:.2%} ({len(a)} words vs {len(e)} expected)")
# A tiny quantised Whisper model will not be perfect on one sentence; it must
# still be unmistakably this sentence. Below this it is transcribing something
# else, or returning canned text.
print("RESULT:", "PASS" if ratio >= 0.75 else "FAIL - transcript does not match the fixture")
raise SystemExit(0 if ratio >= 0.75 else 1)
PY
