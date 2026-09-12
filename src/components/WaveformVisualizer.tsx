import React from 'react';
import { View } from 'react-native';

interface WaveformVisualizerProps {
  isRecording: boolean;
  meteringLevel?: number; // typically -160 to 0 dB
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording,
  meteringLevel = -30,
}) => {
  // Normalize metering level to bar heights
  const normalized = Math.max(0.1, Math.min(1, (meteringLevel + 60) / 60));

  const barCount = 18;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Dynamic height calculation with center weighting
    const factor = Math.sin((i / barCount) * Math.PI);
    const height = isRecording ? Math.max(8, factor * normalized * 48) : 6;
    return height;
  });

  return (
    <View className="flex-row items-center justify-center space-x-1.5 h-16 w-full px-4">
      {bars.map((h, idx) => (
        <View
          key={idx}
          style={{ height: h }}
          className={`w-1 rounded-full ${
            isRecording ? 'bg-cyan-400' : 'bg-slate-700'
          }`}
        />
      ))}
    </View>
  );
};
