import { Audio } from 'expo-av';

let recordingInstance: Audio.Recording | null = null;

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const startRecordingAudio = async (
  onMeteringUpdate?: (metering: number) => void
): Promise<boolean> => {
  try {
    const granted = await requestMicrophonePermission();
    if (!granted) return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    if (onMeteringUpdate) {
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          onMeteringUpdate(status.metering);
        }
      });
      recording.setProgressUpdateInterval(100);
    }

    await recording.startAsync();
    recordingInstance = recording;
    return true;
  } catch (err) {
    console.error('Failed to start recording:', err);
    return false;
  }
};

export const stopRecordingAudio = async (): Promise<string | null> => {
  try {
    if (!recordingInstance) return null;
    await recordingInstance.stopAndUnloadAsync();
    const uri = recordingInstance.getURI();
    recordingInstance = null;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    return uri;
  } catch (err) {
    console.error('Failed to stop recording:', err);
    return null;
  }
};
