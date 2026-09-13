import { create } from 'zustand';
import { TranscriptionResult } from '../engine/whisperEngine';

export interface SavedRecording {
  id: string;
  title: string;
  uri: string;
  duration: number; // in seconds
  createdAt: string;
  transcript?: TranscriptionResult;
}

interface AudioState {
  isRecording: boolean;
  recordingDuration: number;
  meteringLevel: number;
  activeAudioUri: string | null;
  recordings: SavedRecording[];
  currentTranscript: TranscriptionResult | null;
  activeRecordingTitle: string;
  isPro: boolean;
  isTranscribing: boolean;
  dailyTranscriptionsCount: number;

  // Actions
  setIsRecording: (isRecording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  setMeteringLevel: (metering: number) => void;
  setActiveAudioUri: (uri: string | null) => void;
  setActiveRecordingTitle: (title: string) => void;
  addRecording: (rec: SavedRecording) => void;
  deleteRecording: (id: string) => void;
  setCurrentTranscript: (transcript: TranscriptionResult | null) => void;
  setIsPro: (isPro: boolean) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
  incrementDailyCount: () => void;
  reset: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isRecording: false,
  recordingDuration: 0,
  meteringLevel: -60,
  activeAudioUri: null,
  recordings: [],
  currentTranscript: null,
  activeRecordingTitle: 'Voice Memo',
  isPro: false,
  isTranscribing: false,
  dailyTranscriptionsCount: 0,

  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
  setMeteringLevel: (meteringLevel) => set({ meteringLevel }),
  setActiveAudioUri: (activeAudioUri) => set({ activeAudioUri }),
  setActiveRecordingTitle: (activeRecordingTitle) => set({ activeRecordingTitle }),
  addRecording: (rec) =>
    set((state) => ({
      recordings: [rec, ...state.recordings],
    })),
  deleteRecording: (id) =>
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    })),
  setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
  setIsPro: (isPro) => set({ isPro }),
  setIsTranscribing: (isTranscribing) => set({ isTranscribing }),
  incrementDailyCount: () =>
    set((state) => ({
      dailyTranscriptionsCount: state.dailyTranscriptionsCount + 1,
    })),
  reset: () =>
    set({
      isRecording: false,
      recordingDuration: 0,
      activeAudioUri: null,
      currentTranscript: null,
      isTranscribing: false,
    }),
}));
