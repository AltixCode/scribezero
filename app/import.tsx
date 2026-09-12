import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Upload, FileAudio, Sparkles, Lock, ArrowLeft } from 'lucide-react-native';
import { useAudioStore } from '../src/store/useAudioStore';
import { transcribeAudio } from '../src/engine/whisperEngine';
import { PaywallModal } from '../src/components/PaywallModal';
import { t } from '../src/i18n';

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
        setActiveRecordingTitle(asset.name || t('importedAudio'));

        const transcriptResult = await transcribeAudio(asset.uri, model);
        setCurrentTranscript(transcriptResult);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/transcript');
      }
    } catch {
      Alert.alert(t('importError'), t('importErrorDesc'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 py-6 justify-center items-center">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#38BDF8" className="mb-4" />
          <Text className="text-white font-bold text-base">{t('transcribingWhisper')}</Text>
          <Text className="text-slate-400 text-xs text-center mt-1 max-w-xs">
            {t('transcribingWhisperDesc')}
          </Text>
        </View>
      ) : (
        <View className="w-full items-center">
          <View className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-full mb-6">
            <FileAudio size={48} color="#38BDF8" />
          </View>

          <Text className="text-2xl font-extrabold text-white text-center mb-2">
            {t('importAudioTitle')}
          </Text>
          <Text className="text-slate-400 text-xs text-center max-w-xs leading-relaxed mb-8">
            {t('importAudioLongDesc')}
          </Text>

          {!isPro && (
            <View className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl w-full mb-6 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-amber-300 font-bold text-xs">{t('proFeature')}</Text>
                <Text className="text-amber-200/70 text-[10px] mt-0.5">
                  {t('proFeatureDesc')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                className="bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 flex-row items-center"
              >
                <Lock size={12} color="#F59E0B" />
                <Text className="text-amber-400 text-xs font-bold ml-1">{t('unlockPro')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickAudio}
            activeOpacity={0.85}
            className="w-full bg-cyan-600 active:bg-cyan-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-cyan-500/20 mb-4"
          >
            <Upload size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">{t('selectAudioFile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="py-2.5 flex-row items-center"
          >
            <ArrowLeft size={14} color="#94A3B8" />
            <Text className="text-slate-400 text-xs font-semibold ml-1.5">{t('back')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
