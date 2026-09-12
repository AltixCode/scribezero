import {
  AudioModule,
  AudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

let recorderInstance: AudioRecorder | null = null;
let meteringInterval: ReturnType<typeof setInterval> | null = null;

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
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

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    const recordingOptions = {
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    };

    const recorder = new AudioModule.AudioRecorder(recordingOptions);
    await recorder.prepareToRecordAsync();
    recorder.record();
    recorderInstance = recorder;

    if (onMeteringUpdate) {
      if (meteringInterval) {
        clearInterval(meteringInterval);
      }
      meteringInterval = setInterval(() => {
        if (recorderInstance) {
          try {
            const status = recorderInstance.getStatus();
            if (status.metering !== undefined) {
              onMeteringUpdate(status.metering);
            }
          } catch {
            // ignore status query errors during transition
          }
        }
      }, 100);
    }

    return true;
  } catch (err) {
    console.error('Failed to start recording:', err);
    return false;
  }
};

export const stopRecordingAudio = async (): Promise<string | null> => {
  try {
    if (meteringInterval) {
      clearInterval(meteringInterval);
      meteringInterval = null;
    }

    if (!recorderInstance) return null;
    await recorderInstance.stop();
    const uri = recorderInstance.uri;
    recorderInstance = null;

    await setAudioModeAsync({
      allowsRecording: false,
    });

    return uri;
  } catch (err) {
    console.error('Failed to stop recording:', err);
    return null;
  }
};

