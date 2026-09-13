#!/usr/bin/env python3
"""Scores a transcript against the fixture's known sentence.

The stub this replaces returned a fixed paragraph about a "product architecture
review" for any input, so a transcript that merely looks like prose proves
nothing. Word recall against the known sentence does.

Usage: verify-transcript.py <expected.txt> <actual.txt> [min_recall]
"""
import re
import sys


def words(text: str) -> list[str]:
    return re.findall(r"[a-z']+", text.lower())


expected_path, actual_path = sys.argv[1], sys.argv[2]
threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.8

expected = words(open(expected_path).read())
actual = set(words(open(actual_path).read()))

hits = [w for w in expected if w in actual]
recall = len(hits) / len(expected) if expected else 0.0
missing = [w for w in expected if w not in actual]

print(f"expected words: {len(expected)}")
print(f"matched:        {len(hits)}")
print(f"recall:         {recall:.0%}")
if missing:
    print(f"missing:        {', '.join(missing)}")

ok = recall >= threshold
print(
    f"RESULT: {'PASS' if ok else 'FAIL'} - transcript "
    f"{'reflects the spoken audio' if ok else 'does not match the spoken audio'}"
)
sys.exit(0 if ok else 1)
