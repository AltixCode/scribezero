# AGENT WORK TRACKING & HANDOFF STATE

## Current Status: ENGINE_VERIFIED — in-app end-to-end and Android pass outstanding

## Last Updated: 2026-09-13T16:20:00+03:00

## What was wrong

`src/engine/whisperEngine.ts` did not transcribe. It awaited two `setTimeout`s
and returned four hard-coded sentences about a "product architecture review",
identical for every input audio file. There was no model, no inference, and no
speech recognition of any kind.

The UI also made claims the implementation could not support:
* "Zero internet required" — a model must be fetched once.
* "OpenAI Whisper Neural Engine" — another company's trademark as the product's
  own engine name.
* "native NPU hardware acceleration" — the build does not enable a CoreML or
  NNAPI path.

## What is now true

* Real inference through `whisper.rn` (whisper.cpp) with the quantised
  multilingual tiny model. The `.en` variants were rejected because they are
  English-only and the app ships in fourteen locales.
* The model is fetched once on first use behind an explicit gate stating its
  size and that it carries no audio. It is the app's only network request and
  is disclosed in the privacy policy and store data declarations.
* Downloads stage to a `.partial` file and are size-checked before being moved
  into place: handing whisper a truncated model is a native crash, not a
  catchable error.
* Copy now describes what the binary does.

## Verification performed

Fixture: `scripts/make-fixture.sh` speaks a known sentence to 16 kHz mono WAV
and writes the expected text beside it.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| Release build + install | PASS |
| Launch to first frame | PASS |
| Model URL resolves and file is valid | PASS — 30.7 MB |
| **Transcription of the fixture by the shipped model** | **PASS — 100% word recall** |

```
expected words: 15   matched: 15   recall: 100%
RESULT: PASS - transcript reflects the spoken audio
```

Reproduce: `scripts/make-fixture.sh` then
`whisper-cli -m <model> -f scribe-fixture.wav` and
`scripts/verify-transcript.py scribe-expected.txt <actual>`.

## Outstanding

* **In-app end-to-end**: NOT RUN. The import path is Pro-gated and the record
  path needs real microphone input, which the simulator cannot be fed. The
  model, the audio handling and the inference are verified above; what remains
  unverified is the `whisper.rn` binding inside the app. Needs a physical device
  with a sandbox account, or a StoreKit launch through Xcode.
* Android emulator pass: NOT RUN.
* Store listing, screenshots, icon, keywords: NOT DONE.
* IAP `scribezero_pro_lifetime` exists, priced $7.99, `MISSING_METADATA`
  pending the App Review paywall screenshot.
