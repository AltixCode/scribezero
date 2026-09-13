#!/usr/bin/env bash
# Renders a known sentence to 16 kHz mono WAV, the format whisper.cpp expects.
# Having the expected text on disk lets the verifier score the transcript
# against ground truth instead of a human deciding it "looks right".
set -euo pipefail

SENTENCE="The quick brown fox jumps over the lazy dog near the river bank at sunrise"
OUT_DIR="${1:-/tmp}"

say -v Samantha -r 165 -o "$OUT_DIR/scribe-fixture.aiff" "$SENTENCE"
afconvert -f WAVE -d LEI16@16000 -c 1 "$OUT_DIR/scribe-fixture.aiff" "$OUT_DIR/scribe-fixture.wav"
rm -f "$OUT_DIR/scribe-fixture.aiff"
printf '%s\n' "$SENTENCE" > "$OUT_DIR/scribe-expected.txt"

echo "wrote $OUT_DIR/scribe-fixture.wav and scribe-expected.txt"
