import * as FileSystem from 'expo-file-system/legacy';
import { TranscriptSegment } from './whisperEngine';

const formatSrtTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
};

export const generateSrtContent = (segments: TranscriptSegment[]): string => {
  return segments
    .map((seg, idx) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${idx + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join('\n');
};

export const generateMarkdownContent = (
  title: string,
  segments: TranscriptSegment[],
  fullText: string
): string => {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  const formatTime = (s: number) => `${pad(s / 60)}:${pad(s % 60)}`;

  let md = `# ${title}\n\n`;
  md += `*Transcribed offline with ScribeZero (On-Device Neural Whisper)*\n\n`;
  md += `## Full Text\n\n${fullText}\n\n`;
  md += `## Timestamped Transcript\n\n`;

  segments.forEach((seg) => {
    md += `- **[${formatTime(seg.start)} - ${formatTime(seg.end)}]** ${seg.text}\n`;
  });

  return md;
};

export const saveTranscriptFile = async (
  filename: string,
  content: string
): Promise<string> => {
  const baseCache = FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  const exportPath = `${baseCache}${filename}`;

  await FileSystem.writeAsStringAsync(exportPath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return exportPath;
};
