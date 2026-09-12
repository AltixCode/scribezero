import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Upload, FileAudio, Sparkles, Lock, ArrowLeft } from 'lucide-react-native';
import { useAudioStore } from '../src/store/useAudioStore';
import { transcribeAudio } from '../src/engine/whisperEngine';
import { PaywallModal } from '../src/components/PaywallModal';

export default function ImportScreen() {
  const router = useRouter();
  const { isPro, model, setCurrentTranscript, setActiveRecordingTitle } = useAudioStore();

  const [loading, setLoading] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handlePickAudio = async () => {
    if (!isPro) {
      setPaywallVisible(true);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLoading(true);
        setActiveRecordingTitle(asset.name || 'Imported Audio');

        const transcriptResult = await transcribeAudio(asset.uri, model);
        setCurrentTranscript(transcriptResult);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/transcript');
      }
    } catch {
      Alert.alert('Import Error', 'Failed to read external audio file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 py-6 justify-center items-center">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#38BDF8" className="mb-4" />
          <Text className="text-white font-bold text-base">Transcribing with Whisper Neural Model</Text>
          <Text className="text-slate-400 text-xs text-center mt-1 max-w-xs">
            Running 16kHz mono tensor passes locally on your device hardware...
          </Text>
        </View>
      ) : (
        <View className="w-full items-center">
          <View className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-full mb-6">
            <FileAudio size={48} color="#38BDF8" />
          </View>

          <Text className="text-2xl font-extrabold text-white text-center mb-2">
            Import External Audio
          </Text>
          <Text className="text-slate-400 text-xs text-center max-w-xs leading-relaxed mb-8">
            Supports .mp3, .m4a, and .wav files. Process recorded lectures, zoom audio, and podcast
            tracks offline.
          </Text>

          {!isPro && (
            <View className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl w-full mb-6 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-amber-300 font-bold text-xs">Pro Feature</Text>
                <Text className="text-amber-200/70 text-[10px] mt-0.5">
                  External audio imports require ScribeZero Pro.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                className="bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 flex-row items-center"
              >
                <Lock size={12} color="#F59E0B" />
                <Text className="text-amber-400 text-xs font-bold ml-1">Unlock ($7.99)</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickAudio}
            activeOpacity={0.85}
            className="w-full bg-cyan-600 active:bg-cyan-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-cyan-500/20 mb-4"
          >
            <Upload size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">Select Audio File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="py-2.5 flex-row items-center"
          >
            <ArrowLeft size={14} color="#94A3B8" />
            <Text className="text-slate-400 text-xs font-semibold ml-1.5">Back to Voice Memos</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
