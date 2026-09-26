import { Audio } from "expo-av";
import * as KeepAwake from "expo-keep-awake";

class AudioRecorderService {
  private recording: Audio.Recording | null = null;

  async startRecording() {
    if (this.recording) {
      return {
        success: false,
        error: "Recording already active",
      };
    }

    const { status } =
      await Audio.requestPermissionsAsync();

    if (status !== "granted") {
      return {
        success: false,
        error: "Permission denied",
      };
    }

    const recordingOptions: any = {
      ios: {
        extension: ".wav",
        sampleRate: 44100,
        numberOfChannels: 1,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },

      android: {
        extension: ".wav",
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },

      isMeteringEnabled: true,
    };

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { recording } =
      await Audio.Recording.createAsync(
        recordingOptions,
      );

    this.recording = recording;

    await KeepAwake.activateKeepAwakeAsync();

    return {
      success: true,
    };
  }

  async stopRecording() {
    if (!this.recording) {
      return {
        success: false,
      };
    }

    await this.recording.stopAndUnloadAsync();

    const uri = this.recording.getURI();

    this.recording = null;

    await KeepAwake.deactivateKeepAwake();

    return {
      success: true,
      uri,
    };
  }

  async cleanup() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
      }
    } catch (e) {}

    this.recording = null;
  }
}

export default new AudioRecorderService();