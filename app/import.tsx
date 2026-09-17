import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// The imperative `router`, not `useRouter()`. The navigation below runs in the
// continuation after `await`ing a native picker, and iOS can tear the presenting
// view down around that sheet -- so the context the hook captured at render may
// be gone by the time it resumes, and the hook's router throws "Couldn't find a
// navigation context" from a getKey getter. The imperative router reads no
// context and is what expo-router provides for navigating outside a render.
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Upload, FileAudio, Lock, ArrowLeft } from 'lucide-react-native';
import { useAudioStore } from '../src/store/useAudioStore';
import { transcribeAudio } from '../src/engine/whisperEngine';
import { PaywallModal } from '../src/components/PaywallModal';
import { useTheme } from '../src/theme/useTheme';
import { usePaywall } from '../src/hooks/usePaywall';
import { t } from '../src/i18n';

export default function ImportScreen() {
  const { priceString } = usePaywall(() => undefined);
  const theme = useTheme();
  const { isPro, setCurrentTranscript, setActiveRecordingTitle } = useAudioStore();

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

        const transcriptResult = await transcribeAudio(asset.uri);
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
    <View style={{ flex: 1, backgroundColor: theme.background }} className="px-6 py-6 justify-center items-center">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color={theme.primary} className="mb-4" />
          <Text style={{ color: theme.text }} className="font-bold text-base">{t('transcribingWhisper')}</Text>
          <Text style={{ color: theme.textSecondary }} className="text-xs text-center mt-1 max-w-xs">
            {t('transcribingWhisperDesc')}
          </Text>
        </View>
      ) : (
        <View className="w-full items-center">
          <View
            style={{
              backgroundColor: theme.accentLight,
              borderColor: theme.accentBorder,
            }}
            className="border p-6 rounded-full mb-6"
          >
            <FileAudio size={48} color={theme.accent} />
          </View>

          <Text style={{ color: theme.text }} className="text-2xl font-extrabold text-center mb-2">
            {t('importAudioTitle')}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="text-xs text-center max-w-xs leading-relaxed mb-8">
            {t('importAudioLongDesc')}
          </Text>

          {!isPro && (
            <View
              style={{
                backgroundColor: theme.warningLight,
                borderColor: theme.warning,
              }}
              className="border p-4 rounded-2xl w-full mb-6 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-3">
                <Text style={{ color: theme.text }} className="font-bold text-xs">{t('proFeature')}</Text>
                <Text style={{ color: theme.textSecondary }} className="text-[11px] mt-0.5">
                  {t('proFeatureDesc')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.warning,
                }}
                className="px-3 py-1.5 rounded-lg border flex-row items-center"
              >
                <Lock size={12} color={theme.warning} />
                <Text style={{ color: theme.warning }} className="text-xs font-bold ml-1.5">{t('unlockPro', { price: priceString ?? '' })}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickAudio}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            className="w-full py-4 rounded-2xl flex-row items-center justify-center mb-4 min-h-[50px]"
          >
            <Upload size={18} color="#FFFFFF" />
            <Text className="font-bold text-base ml-2" style={{ color: theme.text }}>{t('selectAudioFile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="py-3 flex-row items-center min-h-[44px]"
          >
            <ArrowLeft size={14} color={theme.textMuted} />
            <Text style={{ color: theme.textSecondary }} className="text-xs font-semibold ml-1.5">{t('back')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
