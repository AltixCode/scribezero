import { initWhisper, type WhisperContext } from "whisper.rn/index";
import { getModelStatus, modelPath } from "../services/modelManager";

export interface TranscriptSegment {
  id: string;
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  duration: number;
}

export class ModelMissingError extends Error {
  constructor() {
    super("The speech model has not been downloaded yet.");
    this.name = "ModelMissingError";
  }
}

let context: WhisperContext | null = null;
let loading: Promise<WhisperContext> | null = null;

/**
 * Loads the whisper context once and reuses it.
 *
 * Initialisation reads a ~31 MB model into memory, so doing it per transcription
 * would dominate the runtime and churn memory on older devices.
 */
const getContext = async (): Promise<WhisperContext> => {
  if (context) return context;
  if (loading) return loading;

  loading = (async () => {
    const status = await getModelStatus();
    if (!status.ready) throw new ModelMissingError();

    const created = await initWhisper({ filePath: modelPath() });
    context = created;
    return created;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
};

/**
 * Transcribes a recording on device.
 *
 * This replaces a stub that returned four hard-coded sentences after two
 * setTimeouts, identical for every input. Inference runs locally through
 * whisper.cpp; no audio leaves the device.
 */
export const transcribeAudio = async (
  audioUri: string,
  onProgress?: (progress: number) => void,
): Promise<TranscriptionResult> => {
  const whisper = await getContext();

  onProgress?.(0.05);

  const { promise } = whisper.transcribe(audioUri, {
    // Auto-detect rather than assuming English: the app ships in fourteen
    // locales and the model is the multilingual build.
    language: "auto",
    onProgress: (value: number) => {
      // whisper.cpp reports 0-100.
      onProgress?.(Math.min(0.99, Math.max(0.05, value / 100)));
    },
  });

  const result = await promise;
  onProgress?.(1);

  const segments: TranscriptSegment[] = (result.segments ?? [])
    .map((segment, index) => ({
      id: `seg_${index}`,
      // whisper.cpp timestamps are centiseconds.
      start: segment.t0 / 100,
      end: segment.t1 / 100,
      text: segment.text.trim(),
    }))
    .filter((segment) => segment.text.length > 0);

  const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

  return {
    fullText: segments
      .map((segment) => segment.text)
      .join(" ")
      .trim(),
    segments,
    duration,
  };
};

export const releaseWhisper = async (): Promise<void> => {
  if (!context) return;
  await context.release();
  context = null;
};
