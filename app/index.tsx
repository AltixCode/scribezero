import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Mic,
  Square,
  Sparkles,
  FileAudio,
  Upload,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Trash2,
} from 'lucide-react-native';
import { useAudioStore, SavedRecording } from '../src/store/useAudioStore';
import { startRecordingAudio, stopRecordingAudio } from '../src/services/audioRecorder';
import { transcribeAudio } from '../src/engine/whisperEngine';
import { WaveformVisualizer } from '../src/components/WaveformVisualizer';
import { PaywallModal } from '../src/components/PaywallModal';

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    isRecording,
    recordingDuration,
    meteringLevel,
    recordings,
    model,
    isPro,
    dailyTranscriptionsCount,
    setIsRecording,
    setRecordingDuration,
    setMeteringLevel,
    addRecording,
    deleteRecording,
    setCurrentTranscript,
    setActiveRecordingTitle,
    incrementDailyCount,
  } = useAudioStore();

  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(useAudioStore.getState().recordingDuration + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleToggleRecord = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isRecording) {
      // Stop recording
      const uri = await stopRecordingAudio();
      setIsRecording(false);

      if (uri) {
        const duration = recordingDuration || 5;
        const newRec: SavedRecording = {
          id: `rec_${Date.now()}`,
          title: `Voice Memo #${recordings.length + 1}`,
          uri,
          duration,
          createdAt: new Date().toISOString(),
        };
        addRecording(newRec);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Start recording
      const success = await startRecordingAudio((metering) => {
        setMeteringLevel(metering);
      });
      if (success) {
        setIsRecording(true);
      } else {
        Alert.alert('Permission Denied', 'Please grant microphone access to record audio.');
      }
    }
  };

  const handleTranscribe = async (rec: SavedRecording) => {
    // Check free limits: 3 transcriptions/day up to 3 mins
    if (!isPro) {
      if (rec.duration > 180 || dailyTranscriptionsCount >= 3) {
        setPaywallVisible(true);
        return;
      }
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTranscribingId(rec.id);
      setActiveRecordingTitle(rec.title);

      const result = await transcribeAudio(rec.uri, model);
      setCurrentTranscript(result);
      incrementDailyCount();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/transcript');
    } catch {
      Alert.alert('Error', 'Transcription failed.');
    } finally {
      setTranscribingId(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero Section */}
        <View className="mt-4 mb-4">
          <View className="inline-flex self-start bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color="#38BDF8" />
            <Text className="text-cyan-400 text-xs font-semibold ml-1.5">
              OpenAI Whisper Neural Engine
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">
            On-Device Transcribe
          </Text>
          <Text className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Convert voice memos and lectures to text locally using hardware-accelerated Whisper.
            Zero internet required.
          </Text>
        </View>

        {/* Big Record Button & Audio Waveform Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mb-5 relative">
          <WaveformVisualizer isRecording={isRecording} meteringLevel={meteringLevel} />

          <Text className="text-3xl font-mono font-extrabold text-white my-3">
            {formatSeconds(recordingDuration)}
          </Text>

          <TouchableOpacity
            onPress={handleToggleRecord}
            activeOpacity={0.8}
            className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${
              isRecording
                ? 'bg-rose-600 shadow-rose-600/40'
                : 'bg-cyan-600 shadow-cyan-600/40'
            }`}
          >
            {isRecording ? (
              <Square size={26} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Mic size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <Text className="text-slate-400 text-xs mt-3">
            {isRecording ? 'Tap to Stop & Save Memo' : 'Tap to Start Recording'}
          </Text>
        </View>

        {/* Import External File Quick Action */}
        <TouchableOpacity
          onPress={() => router.push('/import')}
          activeOpacity={0.8}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-blue-500/15 p-2.5 rounded-xl mr-3">
              <Upload size={18} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Import External Audio</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Transcribe .mp3, .m4a, or .wav recordings
              </Text>
            </View>
          </View>
          <ArrowRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Saved Recordings List */}
        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Voice Memos ({recordings.length})
        </Text>

        {recordings.length > 0 ? (
          <View className="space-y-3 mb-6">
            {recordings.map((rec) => (
              <View
                key={rec.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="bg-cyan-500/20 p-2.5 rounded-xl mr-3">
                    <FileAudio size={20} color="#38BDF8" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>
                      {rec.title}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {formatSeconds(rec.duration)} • {new Date(rec.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => handleTranscribe(rec)}
                    disabled={transcribingId === rec.id}
                    className="bg-cyan-600 px-3 py-1.5 rounded-xl flex-row items-center mr-1"
                  >
                    {transcribingId === rec.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={12} color="#FFFFFF" />
                        <Text className="text-white font-bold text-xs ml-1">Transcribe</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      deleteRecording(rec.id);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800"
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-6 items-center justify-center mb-6">
            <Text className="text-slate-400 text-xs text-center">
              No voice memos recorded yet. Tap the microphone to capture audio.
            </Text>
          </View>
        )}

        {/* Privacy & Architectural Guarantees */}
        <View className="space-y-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Local Machine Learning
          </Text>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-cyan-500/10 p-2 rounded-xl mr-3">
              <Cpu size={18} color="#38BDF8" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Apple Neural Engine / NNAPI</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Executes C++ whisper.cpp quantized neural weights using native NPU hardware
                acceleration. Zero battery drain from video uploads.
              </Text>
            </View>
          </View>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start">
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Zero Server Uploads</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Confidential board meetings, interviews, and ideas remain completely private in local
                application sandbox storage.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </SafeAreaView>
  );
}
