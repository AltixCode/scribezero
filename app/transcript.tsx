import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {
  FileText,
  FileCode,
  Subtitles,
  Copy,
  Check,
} from 'lucide-react-native';
import { useAudioStore } from '../src/store/useAudioStore';
import {
  generateSrtContent,
  generateMarkdownContent,
  saveTranscriptFile,
} from '../src/engine/exportEngine';
import { TranscriptSegmentCard } from '../src/components/TranscriptSegmentCard';
import { PaywallModal } from '../src/components/PaywallModal';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';
import { useAdsStore } from '../src/store/adsStore';
import { showInterstitial } from '../src/services/ads';
import { shouldShowInterstitial } from '../src/services/adPolicy';

export default function TranscriptScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { currentTranscript, activeRecordingTitle, isPro } = useAudioStore();

  const [copied, setCopied] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!currentTranscript) {
    router.replace('/');
    return null;
  }

  const handleExportSrt = async () => {
    if (!isPro) {
      setPaywallVisible(true);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const srt = generateSrtContent(currentTranscript.segments);
      const path = await saveTranscriptFile('transcript.srt', srt);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch {
      Alert.alert(t('exportError'), t('exportSrtError'));
    }
  };

  const handleExportMarkdown = async () => {
    if (!isPro) {
      setPaywallVisible(true);
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const md = generateMarkdownContent(
        activeRecordingTitle,
        currentTranscript.segments,
        currentTranscript.fullText
      );
      const path = await saveTranscriptFile('transcript.md', md);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch {
      Alert.alert(t('exportError'), t('exportMdError'));
    }
  };

  const maybeShowInterstitial = async () => {
    const { completions, lastInterstitialAt, markInterstitialShown } = useAdsStore.getState();
    const decision = shouldShowInterstitial({
      completions,
      lastInterstitialAt,
      now: Date.now(),
      // Read at call time rather than captured: the user may have bought the upgrade from the
      // paywall between opening this screen and finishing the work.
      isPro: useAudioStore.getState().isPro,
    });
    if (!decision) return;
    // Only a shown-and-dismissed ad resets the clock. Counting an unfilled request would
    // suppress the next several ads for nothing.
    if (await showInterstitial()) await markInterstitialShown();
  };

  const handleExportText = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const path = await saveTranscriptFile('transcript.txt', currentTranscript.fullText);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
        // Behind the share sheet: the transcript has left the app by the time the ad appears.
        await maybeShowInterstitial();
      }
    } catch {
      Alert.alert(t('exportError'), t('exportTxtError'));
    }
  };

  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} className="px-5 py-3">
      {/* Header Info */}
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        }}
        className="border p-4 rounded-2xl mb-4 flex-row items-center justify-between shadow-sm"
      >
        <View className="flex-1 mr-3">
          <Text style={{ color: theme.text }} className="font-bold text-base" numberOfLines={1}>
            {activeRecordingTitle}
          </Text>
          <Text style={{ color: theme.accent }} className="text-xs font-mono mt-0.5 font-semibold">
            {t('modelWhisper', { model: 'WHISPER TINY' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCopy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
          }}
          className="px-3.5 py-2 rounded-xl flex-row items-center"
        >
          {copied ? (
            <>
              <Check size={14} color={theme.success} />
              <Text style={{ color: theme.success }} className="text-xs font-bold ml-1.5">{t('copied')}</Text>
            </>
          ) : (
            <>
              <Copy size={14} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary }} className="text-xs font-bold ml-1.5">{t('copy')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Export Format Ribbons */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={handleExportText}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="flex-1 border py-3 rounded-xl items-center flex-row justify-center mr-1 shadow-sm"
        >
          <FileText size={15} color={theme.primary} />
          <Text style={{ color: theme.text }} className="text-xs font-bold ml-1.5">.TXT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportMarkdown}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="flex-1 border py-3 rounded-xl items-center flex-row justify-center mx-1 shadow-sm"
        >
          <FileCode size={15} color="#A855F7" />
          <Text style={{ color: theme.text }} className="text-xs font-bold ml-1.5">.MD</Text>
          {!isPro && (
            <Text style={{ color: theme.warning }} className="text-[10px] font-extrabold ml-1">
              {t('proBadge')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportSrt}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="flex-1 border py-3 rounded-xl items-center flex-row justify-center ml-1 shadow-sm"
        >
          <Subtitles size={15} color={theme.warning} />
          <Text style={{ color: theme.text }} className="text-xs font-bold ml-1.5">.SRT</Text>
          {!isPro && (
            <Text style={{ color: theme.warning }} className="text-[10px] font-extrabold ml-1">
              {t('proBadge')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Timestamped Segments List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {currentTranscript.segments.map((seg) => (
          <TranscriptSegmentCard key={seg.id} segment={seg} />
        ))}
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
