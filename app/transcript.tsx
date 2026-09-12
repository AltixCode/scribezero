import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {
  Share2,
  FileText,
  FileCode,
  Sparkles,
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

export default function TranscriptScreen() {
  const router = useRouter();
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
      Alert.alert('Export Error', 'Failed to generate SRT subtitles.');
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
      Alert.alert('Export Error', 'Failed to generate Markdown document.');
    }
  };

  const handleExportText = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const path = await saveTranscriptFile('transcript.txt', currentTranscript.fullText);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      }
    } catch {
      Alert.alert('Export Error', 'Failed to export plain text.');
    }
  };

  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="flex-1 bg-slate-950 px-5 py-3">
      {/* Header Info */}
      <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-white font-bold text-base" numberOfLines={1}>
            {activeRecordingTitle}
          </Text>
          <Text className="text-cyan-400 text-xs font-mono mt-0.5">
            Model: Whisper {currentTranscript.modelUsed.toUpperCase()} • 100% On-Device
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCopy}
          className="bg-slate-800 px-3 py-2 rounded-xl flex-row items-center"
        >
          {copied ? (
            <>
              <Check size={14} color="#34D399" />
              <Text className="text-emerald-400 text-xs font-bold ml-1">Copied</Text>
            </>
          ) : (
            <>
              <Copy size={14} color="#94A3B8" />
              <Text className="text-slate-300 text-xs font-bold ml-1">Copy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Export Format Ribbons */}
      <View className="flex-row space-x-2 mb-4">
        <TouchableOpacity
          onPress={handleExportText}
          className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl items-center flex-row justify-center mr-1"
        >
          <FileText size={14} color="#38BDF8" />
          <Text className="text-slate-200 text-xs font-bold ml-1.5">.TXT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportMarkdown}
          className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl items-center flex-row justify-center mx-1"
        >
          <FileCode size={14} color="#C084FC" />
          <Text className="text-slate-200 text-xs font-bold ml-1.5">.MD</Text>
          {!isPro && <Text className="text-amber-400 text-[9px] font-bold ml-1">PRO</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportSrt}
          className="flex-1 bg-slate-900 border border-slate-800 py-2.5 rounded-xl items-center flex-row justify-center ml-1"
        >
          <Subtitles size={14} color="#FBBF24" />
          <Text className="text-slate-200 text-xs font-bold ml-1.5">.SRT</Text>
          {!isPro && <Text className="text-amber-400 text-[9px] font-bold ml-1">PRO</Text>}
        </TouchableOpacity>
      </View>

      {/* Timestamped Segments List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {currentTranscript.segments.map((seg) => (
          <TranscriptSegmentCard key={seg.id} segment={seg} />
        ))}
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
