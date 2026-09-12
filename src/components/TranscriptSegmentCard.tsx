import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { TranscriptSegment } from '../engine/whisperEngine';

interface TranscriptSegmentCardProps {
  segment: TranscriptSegment;
}

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TranscriptSegmentCard: React.FC<TranscriptSegmentCardProps> = ({ segment }) => {
  return (
    <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-3">
      <View className="flex-row items-center mb-1.5">
        <Clock size={12} color="#38BDF8" />
        <Text className="text-cyan-400 font-mono text-[11px] font-bold ml-1">
          {formatSeconds(segment.start)} - {formatSeconds(segment.end)}
        </Text>
      </View>
      <Text className="text-slate-200 text-sm leading-relaxed">{segment.text}</Text>
    </View>
  );
};
