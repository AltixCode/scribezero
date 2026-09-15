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
  ShieldCheck,
  Cpu,
  Trash2,
} from 'lucide-react-native';
import { useAudioStore, SavedRecording } from '../src/store/useAudioStore';
import { startRecordingAudio, stopRecordingAudio } from '../src/services/audioRecorder';
import { transcribeAudio } from '../src/engine/whisperEngine';
import { WaveformVisualizer } from '../src/components/WaveformVisualizer';
import { PaywallModal } from '../src/components/PaywallModal';
import { useTheme } from '../src/theme/useTheme';
import { ModelGate } from '../src/components/ModelGate';
import { getModelStatus } from '../src/services/modelManager';
import { ModelMissingError } from '../src/engine/whisperEngine';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function HomeScreen() {
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const router = useRouter();
  const theme = useTheme();
  const {
    isRecording,
    recordingDuration,
    meteringLevel,
    recordings,
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
  const [modelGateVisible, setModelGateVisible] = useState(false);
  const [pendingRecording, setPendingRecording] = useState<SavedRecording | null>(null);
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
          title: t('voiceMemoDefault', { number: recordings.length + 1 }),
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
        Alert.alert(t('micPermission'), t('micPermissionDesc'));
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

    // Transcription cannot start without the model; ask for it rather than
    // failing with an opaque native error.
    const status = await getModelStatus();
    if (!status.ready) {
      setPendingRecording(rec);
      setModelGateVisible(true);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTranscribingId(rec.id);
      setActiveRecordingTitle(rec.title);

      const result = await transcribeAudio(rec.uri);
      setCurrentTranscript(result);
      incrementDailyCount();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // A finished transcript is what this app exists to produce, so it is what paces the
      // interstitial. The ad itself is shown on the transcript screen, behind an export --
      // never between asking for a transcript and seeing it.
      void useAdsStore.getState().recordCompletion();
      router.push('/transcript');
    } catch (err) {
      if (err instanceof ModelMissingError) {
        setPendingRecording(rec);
        setModelGateVisible(true);
      } else {
        Alert.alert(t('error'), t('transcriptionFailed'));
      }
    } finally {
      setTranscribingId(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.background }} className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero Section */}
        <View className="mt-4 mb-4">
          <View
            style={{
              backgroundColor: theme.accentLight,
              borderColor: theme.accentBorder,
            }}
            className="self-start border px-3 py-1 rounded-full mb-3 flex-row items-center"
          >
            <Sparkles size={13} color={theme.accent} />
            <Text style={{ color: theme.accent }} className="text-xs font-semibold ml-1.5">
              {t('heroBadge')}
            </Text>
          </View>
          <Text style={{ color: theme.text }} className="text-3xl font-extrabold tracking-tight">
            {t('heroTitle')}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="text-sm mt-1.5 leading-relaxed">
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Big Record Button & Audio Waveform Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="border rounded-3xl p-6 items-center mb-5 relative shadow-sm"
        >
          <WaveformVisualizer isRecording={isRecording} meteringLevel={meteringLevel} />

          <Text style={{ color: theme.text }} className="text-3xl font-mono font-extrabold my-3">
            {formatSeconds(recordingDuration)}
          </Text>

          <TouchableOpacity
            onPress={handleToggleRecord}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              backgroundColor: isRecording ? '#E11D48' : theme.primary,
              shadowColor: isRecording ? '#E11D48' : theme.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
            className="w-20 h-20 rounded-full items-center justify-center"
          >
            {isRecording ? (
              <Square size={26} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Mic size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <Text style={{ color: theme.textMuted }} className="text-xs mt-3 font-medium">
            {isRecording ? t('tapToStop') : t('tapToStart')}
          </Text>
        </View>

        {/* Import External File Quick Action */}
        <TouchableOpacity
          onPress={() => router.push('/import')}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="border p-4 rounded-2xl mb-5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{ backgroundColor: theme.primaryLight }}
              className="p-2.5 rounded-xl mr-3"
            >
              <Upload size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">
                {t('importAudioPrompt')}
              </Text>
              <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">
                {t('importAudioDesc')}
              </Text>
            </View>
          </View>
          <ForwardArrow size={16} color={theme.textMuted} />
        </TouchableOpacity>

        {/* Saved Recordings List */}
        <Text style={{ color: theme.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">
          {t('voiceMemos', { count: recordings.length })}
        </Text>

        {recordings.length > 0 ? (
          <View className="mb-6">
            {recordings.map((rec) => (
              <View
                key={rec.id}
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
                className="border p-4 rounded-2xl mb-3 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    style={{ backgroundColor: theme.accentLight }}
                    className="p-2.5 rounded-xl mr-3"
                  >
                    <FileAudio size={20} color={theme.accent} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: theme.text }} className="font-bold text-sm" numberOfLines={1}>
                      {rec.title}
                    </Text>
                    <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 font-medium">
                      {formatSeconds(rec.duration)} • {new Date(rec.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleTranscribe(rec)}
                    disabled={transcribingId === rec.id}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={{ backgroundColor: theme.primary }}
                    className="px-3.5 py-2 rounded-xl flex-row items-center mr-1.5"
                  >
                    {transcribingId === rec.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={12} color="#FFFFFF" />
                        <Text className="font-bold text-xs ml-1" style={{ color: theme.text }}>{t('transcribe')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      deleteRecording(rec.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }}
                    className="p-2 rounded-lg"
                  >
                    <Trash2 size={15} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF',
              borderColor: theme.cardBorder,
            }}
            className="border border-dashed rounded-3xl p-6 items-center justify-center mb-6"
          >
            <Text style={{ color: theme.textMuted }} className="text-xs text-center font-medium">
              {t('noVoiceMemos')}
            </Text>
          </View>
        )}

        {/* Privacy & Architectural Guarantees */}
        <View className="flex-col gap-3">
          <Text style={{ color: theme.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-2">
            {t('localMl')}
          </Text>

          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="border p-4 rounded-2xl flex-row items-start mb-3 shadow-sm"
          >
            <View style={{ backgroundColor: theme.accentLight }} className="p-2 rounded-xl mr-3">
              <Cpu size={18} color={theme.accent} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">{t('neuralEngine')}</Text>
              <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">
                {t('neuralEngineDesc')}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="border p-4 rounded-2xl flex-row items-start shadow-sm"
          >
            <View style={{ backgroundColor: theme.successLight }} className="p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color={theme.success} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">{t('zeroServerUploads')}</Text>
              <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">
                {t('zeroServerUploadsDesc')}
              </Text>
            </View>
          </View>
        </View>
        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      <ModelGate
        visible={modelGateVisible}
        onCancel={() => {
          setModelGateVisible(false);
          setPendingRecording(null);
        }}
        onReady={() => {
          setModelGateVisible(false);
          const queued = pendingRecording;
          setPendingRecording(null);
          if (queued) handleTranscribe(queued);
        }}
      />
    </SafeAreaView>
  );
}
