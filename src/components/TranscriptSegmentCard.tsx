import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { TranscriptSegment } from '../engine/whisperEngine';
import { useTheme } from '../theme/useTheme';

interface TranscriptSegmentCardProps {
  segment: TranscriptSegment;
}

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TranscriptSegmentCard: React.FC<TranscriptSegmentCardProps> = ({ segment }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
      }}
      className="border p-4 rounded-2xl mb-3 shadow-sm"
    >
      <View className="flex-row items-center mb-1.5">
        <Clock size={12} color={theme.accent} />
        <Text style={{ color: theme.accent }} className="font-mono text-[11px] font-bold ml-1.5">
          {formatSeconds(segment.start)} - {formatSeconds(segment.end)}
        </Text>
      </View>
      <Text style={{ color: theme.text }} className="text-sm leading-relaxed">
        {segment.text}
      </Text>
    </View>
  );
};
