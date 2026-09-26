import { Ionicons, Octicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as KeepAwake from "expo-keep-awake";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useThemeColors } from "./ThemeContext";

export default function AudioService({
  setStatus,
  setShowSnackbar,
  setMode,
  setAudioBlob,
  setFileBlob,
  setSelectedFile,
  setRecordUri,
  recording,
  setRecording,
  isRecording,
  setIsRecording,
  sound,
  setSound,
}: any) {
  //   const [recording, setRecording] = useState<Audio.Recording | null>(null);
  //   const [recordUri, setRecordUri] = useState<string | null>(null);
  //   const [isRecording, setIsRecording] = useState(false);
  //   const [sound, setSound] = useState<Audio.Sound | null>(null);
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const MIN_RECORD_LOADING_MS = 300;

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone is required!");
      }
    })();

    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync();
      }
      // Deactivate keep awake on unmount
      KeepAwake.deactivateKeepAwake();
    };
  }, [sound]);

  const onRecordPress = async () => {
    if (isLoadingRecord) return;

    try {
      setIsLoadingRecord(true);
      if (!isRecording) {
        // Check permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          setStatus("❌ Microphone permission required");
          setShowSnackbar(true);
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const recordingOptions: any = {
          // iOS - Use proper WAV format settings
          ios: {
            extension: ".wav",
            sampleRate: 44100, // Use standard sample rate for better compatibility
            numberOfChannels: 1,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          // Android
          android: {
            extension: ".wav",
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          // common
          isMeteringEnabled: true,
          keepAudioActiveHint: false,
        };

        const { recording } =
          await Audio.Recording.createAsync(recordingOptions);
        setRecording(recording);
        setIsRecording(true);

        // Keep the screen awake while recording
        await KeepAwake.activateKeepAwakeAsync();
      } else {
        if (recording === null) return;
        // Stop Recording
        setIsRecording(false);
        await recording.stopAndUnloadAsync();

        // Important: reset iOS recording mode before playback starts
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Stop keeping the screen awake
        await KeepAwake.deactivateKeepAwake();

        const originalUri = recording.getURI();
        if (!originalUri) return;

        // Generate new filename: AUD_(date)_(timestamp)
        const now = new Date();
        const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timestamp = now.getTime(); // milliseconds
        const newFileName = `AUD_${date}_${timestamp}.wav`;

        // Get the directory path and create new URI
        const dirPath = originalUri.substring(0, originalUri.lastIndexOf("/"));
        const newUri = `${dirPath}/${newFileName}`;
        // Rename the file by copying to new location and deleting original
        let finalUri = originalUri;
        try {
          // Use the legacy FileSystem API for binary file support
          await FileSystem.copyAsync({
            from: originalUri,
            to: newUri,
          });
          await FileSystem.deleteAsync(originalUri);
          finalUri = newUri;
        } catch (err) {
          console.warn("File rename error:", err);
          // Use original URI if rename fails
        }

        const formatJSON: any = {
          uri: finalUri,
          name:
            finalUri === newUri
              ? newFileName
              : originalUri.split("/").pop() || "recording.wav",
          type: "audio/wav", // Always use WAV format
        };
        setRecordUri(newUri);
        setRecording(null);
        setMode("speech");
        setAudioBlob(formatJSON);

        // Play the recorded audio in speaker mode after the record session is closed
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: finalUri });
          setSound(sound);
          await sound.playAsync();
        } catch (playError) {
          console.warn("Playback error:", playError);
        }
      }
    } catch (err) {
      console.error("Recording error:", err);
      setIsRecording(false);
      setRecording(null);
      // Deactivate keep awake on error
      await KeepAwake.deactivateKeepAwake();
      setStatus("❌ Recording failed. Please try again.");
      setShowSnackbar(true);
    } finally {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_RECORD_LOADING_MS),
      );
      setIsLoadingRecord(false);
    }
  };

  const onUploadPress = async () => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });
      setSelectedFile(res.assets[0].name || res.assets[0].uri);
      setRecordUri(res.assets[0].uri || null);
      const uri = res.assets[0].uri;
      const name = res.assets[0].name;
      const mime = res.assets[0].mimeType || "audio/m4a";
      const formatJSON: any = {
        uri,
        name,
        type: mime,
      };
      setFileBlob(formatJSON);

      setMode("file");
    } catch (err) {
      console.warn("picker error", err);
    }
  };

  return (
    <>
      <View style={[styles.footerContainer]}>
        <View style={styles.footerButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              isLoadingRecord && styles.footerBtnDisabled,
            ]}
            onPress={onRecordPress}
            disabled={isLoadingRecord}
            accessibilityLabel={
              isRecording ? "Stop recording" : "Start recording"
            }
          >
            {isLoadingRecord ? (
              <ActivityIndicator
                size="large"
                color={colors.muted}
              />
            ) : (
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={36}
                color={isRecording ? colors.red : colors.primary}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.footerBtnText}>
            {isRecording ? "Stop" : "Record"}
          </Text>
        </View>

        <View style={styles.footerButtonWrapper}>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={onUploadPress}
            accessibilityLabel="Upload file"
          >
            <Octicons name="upload" size={32} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.footerBtnText}>Upload</Text>
        </View>
      </View>
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    footerBtn: {
      alignItems: "center",
      justifyContent: "center",
      width: 50,
      height: 50,
      borderRadius: 40,
      borderColor: colors.muted2,
      borderWidth: 1,
    },
    footerBtnDisabled: {
      opacity: 0.5,
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 40,
      alignItems: "flex-start",
      paddingVertical: 10,
      paddingBottom: 10,
      position: "absolute",
      bottom: 0,
    },
    footerButtonWrapper: {
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
    },
    footerBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
  });

// import { Ionicons, Octicons } from "@expo/vector-icons";
// import React, { useEffect } from "react";
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Text,
//   Platform,
// } from "react-native";
// import * as DocumentPicker from "expo-document-picker";
// import * as KeepAwake from "expo-keep-awake";
// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system/legacy";
// import AudioRecorderService from "./AudioRecorderService";
// import { useThemeColors } from "./ThemeContext";

// export default function AudioService({
//   setStatus,
//   setShowSnackbar,
//   setMode,
//   setAudioBlob,
//   setFileBlob,
//   setSelectedFile,
//   setRecordUri,
//   isRecording,
//   setIsRecording,
//   sound,
//   setSound,
// }: any) {
//   const colors = useThemeColors();
//   const styles = createStyles(colors);

//   useEffect(() => {
//     (async () => {
//       const { status } = await Audio.requestPermissionsAsync();
//       if (status !== "granted") {
//         alert("Permission to access microphone is required!");
//       }
//     })();

//     return () => {
//       // Cleanup sound on unmount
//       if (sound) {
//         sound.unloadAsync().catch(() => {});
//       }
//       // Ensure any prepared recording is cleaned up
//       AudioRecorderService.cleanup();
//       // Deactivate keep awake on unmount
//       KeepAwake.deactivateKeepAwake();
//     };
//   }, [sound]);

//   // Warm audio session for recording on mount to reduce start latency
//   useEffect(() => {
//     (async () => {
//       try {
//         await Audio.setAudioModeAsync({
//           allowsRecordingIOS: true,
//           playsInSilentModeIOS: true,
//           staysActiveInBackground: true,
//           shouldDuckAndroid: true,
//           playThroughEarpieceAndroid: false,
//         });
//       } catch (e) {
//         // ignore
//       }
//     })();

//     return () => {};
//   }, []);

//   const onRecordPress = async () => {
//     try {
//       if (!isRecording) {
//         const res: any = await AudioRecorderService.startRecording();
//         if (!res.success) {
//           setStatus(res.error || "❌ Could not start recording");
//           setShowSnackbar(true);
//           return;
//         }

//         setIsRecording(true);
//         await KeepAwake.activateKeepAwakeAsync();
//       } else {
//         const stopRes: any = await AudioRecorderService.stopRecording();
//         setIsRecording(false);
//         await KeepAwake.deactivateKeepAwake();

//         if (!stopRes.success || !stopRes.uri) {
//           setStatus("❌ Recording failed. Please try again.");
//           setShowSnackbar(true);
//           return;
//         }

//         const originalUri = stopRes.uri;

//         // Rename file to readable name
//         const now = new Date();
//         const date = now.toISOString().split("T")[0];
//         const timestamp = now.getTime();
//         const newFileName = `AUD_${date}_${timestamp}.wav`;

//         const dirPath = originalUri.substring(0, originalUri.lastIndexOf("/"));
//         const newUri = `${dirPath}/${newFileName}`;
//         // Do file copy/delete in background to avoid blocking UI on stop
//         (async () => {
//           try {
//             await FileSystem.copyAsync({ from: originalUri, to: newUri });
//             await FileSystem.deleteAsync(originalUri);
//             // update recordUri and audioBlob to newUri if successful
//             setRecordUri(newUri);
//             setAudioBlob({ uri: newUri, name: newFileName, type: "audio/wav" });
//           } catch (err) {
//             console.warn("File rename error (background):", err);
//             // fallback to original
//             setRecordUri(originalUri);
//             setAudioBlob({
//               uri: originalUri,
//               name: originalUri.split("/").pop() || "recording.wav",
//               type: "audio/wav",
//             });
//           }
//         })();

//         // Immediately set mode and audioBlob to originalUri so UI is responsive
//         setRecordUri(originalUri);
//         setMode("speech");
//         setAudioBlob({
//           uri: originalUri,
//           name: originalUri.split("/").pop() || "recording.wav",
//           type: "audio/wav",
//         });

//         // Play the recorded audio immediately (non-blocking for file ops)
//         try {
//           if (Platform.OS === "ios") {
//             await Audio.setAudioModeAsync({
//               allowsRecordingIOS: false,
//               playsInSilentModeIOS: true,
//               staysActiveInBackground: false,
//               shouldDuckAndroid: true,
//               playThroughEarpieceAndroid: false,
//             });
//           }

//           // unload any existing sound to avoid lag/resource buildup
//           if (sound) {
//             try {
//               await sound.stopAsync();
//             } catch (e) {}
//             try {
//               await sound.unloadAsync();
//             } catch (e) {}
//             setSound(null);
//           }

//           const { sound: s } = await Audio.Sound.createAsync(
//             { uri: originalUri },
//             { shouldPlay: true },
//           );
//           setSound(s);

//           s.setOnPlaybackStatusUpdate((status: any) => {
//             if (status?.didJustFinish) {
//               try {
//                 s.unloadAsync();
//               } catch (e) {}
//               setSound(null);
//             }
//           });
//         } catch (playErr) {
//           console.warn("Playback after stop error:", playErr);
//         }
//       }
//     } catch (err) {
//       console.error("Recording error:", err);
//       setIsRecording(false);
//       // Deactivate keep awake on error
//       await KeepAwake.deactivateKeepAwake();
//       setStatus("❌ Recording failed. Please try again.");
//       setShowSnackbar(true);
//     }
//   };

//   const onUploadPress = async () => {
//     try {
//       const res: any = await DocumentPicker.getDocumentAsync({
//         type: "audio/*",
//       });
//       if (res.type === "success" && res.assets?.length) {
//         const asset = res.assets[0];
//         setSelectedFile(asset.name || asset.uri);
//         setRecordUri(asset.uri || null);
//         const mime = asset.mimeType || "audio/m4a";
//         setFileBlob({ uri: asset.uri, name: asset.name, type: mime });
//         setMode("file");
//       }
//     } catch (err) {
//       console.warn("picker error", err);
//     }
//   };

//   return (
//     <>
//       <View style={[styles.footerContainer]}>
//         <View style={styles.footerButtonWrapper}>
//           <TouchableOpacity
//             style={styles.footerBtn}
//             onPress={onRecordPress}
//             accessibilityLabel={
//               isRecording ? "Stop recording" : "Start recording"
//             }
//           >
//             <Ionicons
//               name={isRecording ? "stop" : "mic"}
//               size={36}
//               color={isRecording ? colors.red : colors.primary}
//             />
//           </TouchableOpacity>
//           <Text style={styles.footerBtnText}>
//             {isRecording ? "Stop" : "Record"}
//           </Text>
//         </View>

//         <View style={styles.footerButtonWrapper}>
//           <TouchableOpacity
//             style={styles.footerBtn}
//             onPress={onUploadPress}
//             accessibilityLabel="Upload file"
//           >
//             <Octicons name="upload" size={32} color={colors.text} />
//           </TouchableOpacity>
//           <Text style={styles.footerBtnText}>Upload</Text>
//         </View>
//       </View>
//     </>
//   );
// }

// const createStyles = (colors: any) =>
//   StyleSheet.create({
//     footerBtn: {
//       alignItems: "center",
//       justifyContent: "center",
//       width: 50,
//       height: 50,
//       borderRadius: 40,
//       borderColor: colors.muted2,
//       borderWidth: 1,
//     },
//     footerContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       gap: 40,
//       alignItems: "flex-start",
//       paddingVertical: 10,
//       paddingBottom: 10,
//       position: "absolute",
//       bottom: 0,
//     },
//     footerButtonWrapper: {
//       alignItems: "center",
//       justifyContent: "flex-start",
//       gap: 8,
//     },
//     footerBtnText: {
//       fontSize: 12,
//       fontWeight: "600",
//       color: colors.text,
//     },
//   });
