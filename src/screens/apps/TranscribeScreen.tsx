import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as KeepAwake from "expo-keep-awake";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { TRANSCRIBE_API_URL } from "../../axios/apiUrl";
import { useThemeColors } from "../../utils/ThemeContext";
import Loader from "../../utils/Loader";
import Snackbar from "../../utils/Snackbar";
import axiosInstance from "../../axios/interceptors";
import {
  APP_NAME,
  AUDIO_SELECTED_TEXT,
  NO_FILE_SELECTED,
  NO_TRANSCIBED_TEXT,
  NO_TRANSCIBED_TEXT_YET,
  SELECT_ANY_FILE_TEXT,
  TAG_LINE,
  UPLOAD_SUCCESS_NO_TRANSCRIPTION_TEXT,
  UPLOAD_SUCCESS_TEXT,
} from "../../utils/constants";
import { Platform } from "react-native";

const deviceType = Platform.OS;

const { width } = Dimensions.get("window");

export default function TranscribeScreen() {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState<Audio.Recording | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordUri, setRecordUri] = React.useState<string | null>(null);
  const [transcribedText, setTranscribedText] = React.useState<string | null>(
    null,
  );
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [fileBlob, setFileBlob] = React.useState<any | null>(null);
  const [mode, setMode] = useState<"speech" | "file">("speech");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const colors = useThemeColors();
  const styles = createStyles(colors);

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
  // Modal & naming state for confirming upload
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [uniqueId, setUniqueId] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);

  // Generate unique ID in format: CASE-{number}-{year}-{randomNumber}
  const generateUniqueId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const sequenceNumber = Math.floor(Math.random() * 10000);

    return `CASE-${year}-${month}-${date}-${sequenceNumber}`;
  };

  // When user taps the submit button, open modal to ask for a name
  // Do NOT show or prefill the filename — require the user to enter a name
  const onSubmit = async () => {
    if (!selectedFile && !recordUri) {
      setShowSnackbar(true);
      setStatus(SELECT_ANY_FILE_TEXT);
      return;
    }

    // open modal with empty display name so user types it manually
    // Generate a new unique ID for this submission
    const newUniqueId = generateUniqueId();
    setUniqueId(newUniqueId);
    setDisplayName("");
    setConfirmModalVisible(true);
  };

  // Actual upload logic moved to this function and called after modal confirmation
  const submitUpload = async (name: string) => {
    setConfirmModalVisible(false);
    setLoading(true);
    try {
      const blobToUpload = mode === "speech" ? audioBlob : fileBlob;
      if (!blobToUpload) {
        setStatus(AUDIO_SELECTED_TEXT);
        return;
      }

      setTranscribedText(null);
      const formData = new FormData();
      let sourceType =
        deviceType === "ios" || deviceType === "android"
          ? "mobile_" + deviceType
          : deviceType;

      formData.append("audio_file", blobToUpload);
      formData.append("source_type", sourceType);
      formData.append("original_filename", blobToUpload.name);
      formData.append("mode", mode);
      formData.append("device_name", deviceType);
      formData.append("case_id", name);

      axiosInstance
        .post(
          process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL + TRANSCRIBE_API_URL,
          formData,
        )
        .then(async (response: any) => {
          const json = await response.data;
          setTranscribedText(json.transcription || NO_TRANSCIBED_TEXT);
          setLoading(false);
          setShowSnackbar(true);
          setStatus(
            json.status === "success"
              ? UPLOAD_SUCCESS_TEXT
              : UPLOAD_SUCCESS_NO_TRANSCRIPTION_TEXT,
          );
        })
        .catch((err) => {
          console.error("Error while transcribing in api", err);
          setTranscribedText(NO_TRANSCIBED_TEXT);
          setShowSnackbar(true);
          setStatus(
            "❌ Error while transcribing the uploaded file" + err.message
              ? ": " + err.message
              : "",
          );
          setLoading(false);
        });
    } catch (err) {
      console.error("Error while transcribing", err);
      setTranscribedText(NO_TRANSCIBED_TEXT);
      setShowSnackbar(true);
      setStatus("❌ Error while transcribing.");
      setLoading(false);
    }
  };

  useEffect(() => {
    setNameError("");
    setDisplayName("");
  }, [confirmModalVisible]);

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
    try {
      if (!isRecording) {
        // Check permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          setStatus("❌ Microphone permission required");
          setShowSnackbar(true);
          return;
        }

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

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

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

        // Play the recorded audio
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
    }
  };

  const playAudio = async () => {
    try {
      const uri = recordUri;
      if (!uri) return;

      if (sound && isPlaying) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setIsPlaying(false);
        setSound(null);
        return;
      }

      const { sound: s } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      setSound(s);
      setIsPlaying(true);
      s.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          s.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      console.warn("play error", err);
      setStatus("❌ Playback error");
      setShowSnackbar(true);
    }
  };

  const cancelFile = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      // Deactivate keep awake when cancelling
      if (isRecording) {
        await KeepAwake.deactivateKeepAwake();
      }
    } catch (e) {}
    setSelectedFile(null);
    setRecordUri(null);
    setTranscribedText(null);
    setIsRecording(false);
    setRecording(null);
    setIsPlaying(false);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={{ width: width - 40, marginVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../../../assets/favicon.jpeg")}
              style={{ width: 56, height: 56, marginRight: 8 }}
            />
            <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Text style={styles.title}>{APP_NAME}</Text>
              <Text
                style={{
                  marginLeft: 2,
                  color: colors.muted,
                  fontSize: 13,
                  flexWrap: "wrap",
                }}
              >
                {TAG_LINE}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.transcriptBox}>
            {selectedFile || recordUri ? (
              <>
                {transcribedText ? (
                  <Text style={styles.transcriptText}>{transcribedText}</Text>
                ) : (
                  <Text
                    style={[styles.transcriptText, { color: colors.muted }]}
                  >
                    {NO_TRANSCIBED_TEXT_YET}
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.transcriptText, { color: colors.muted }]}>
                {NO_FILE_SELECTED}
              </Text>
            )}
          </ScrollView>
        </View>

        {(selectedFile || recordUri) && (
          <View style={styles.sourceRow}>
            <TouchableOpacity style={[styles.playBtn]} onPress={playAudio}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color={colors.text}
                style={{ marginLeft: !isPlaying ? 2 : 0 }}
              />
            </TouchableOpacity>
            {/* Play / Pause button */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={styles.fileNameText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {selectedFile ?? recordUri?.split("/").pop()}
              </Text>
            </View>
            <View style={styles.sourceActions}>
              <TouchableOpacity
                onPress={onSubmit}
                style={{
                  marginRight: 12,
                  backgroundColor: colors.green,
                  borderRadius: 50,
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="checkmark-sharp"
                  size={22}
                  color={colors.bgStart}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelFile}
                style={{
                  marginRight: 12,
                  backgroundColor: colors.red,
                  borderRadius: 50,
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color={colors.bgStart} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.footerContainer]}>
          <View style={styles.footerButtonWrapper}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={onRecordPress}
              accessibilityLabel={
                isRecording ? "Stop recording" : "Start recording"
              }
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={36}
                color={isRecording ? colors.red : colors.primary}
              />
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
      </View>

      {/* Confirmation modal for upload name */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "height", android: "height" })}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <ScrollView
                contentContainerStyle={styles.scrollViewContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalContainer}>
                  <View>
                    <View style={styles.inputRow}>
                      <Text style={styles.label}>
                        Patient ID / Name{" "}
                        <Text style={{ color: colors.red }}>{"*"}</Text>
                      </Text>

                      <TextInput
                        value={displayName}
                        onChangeText={(text) => {
                          setDisplayName(text);
                          if (text.trim().length > 0) {
                            setNameError(null); // remove error while typing
                          }
                        }}
                        placeholder="Enter Patient ID / name"
                        style={[
                          styles.modalTextInput,
                          nameError && { borderColor: colors.red },
                        ]}
                        placeholderTextColor={colors.muted}
                      />
                      {nameError && (
                        <Text style={styles.errorText}>{nameError}</Text>
                      )}
                    </View>
                    <View style={styles.inputRow}>
                      <Text style={styles.label}>Audio File</Text>
                      <View style={styles.selectedAudioChip}>
                        <Text
                          style={styles.selectedAudioText}
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {selectedFile ?? recordUri?.split("/").pop()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: 5,
                      alignContent: "center",
                    }}
                  >
                    <Pressable
                      onPress={() => setConfirmModalVisible(false)}
                      style={{
                        marginRight: 15,
                        justifyContent: "center",
                        alignContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.red,
                          fontWeight: "500",
                          alignContent: "center",
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (!displayName.trim()) {
                          setNameError("Patient ID / Name is required");
                          return;
                        }

                        setNameError(null);
                        submitUpload(displayName);
                      }}
                      style={{
                        backgroundColor: colors.green,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{ color: colors.bgStart, fontWeight: "600" }}
                      >
                        Upload
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Snackbar visible={showSnackbar} message={status} color={colors} />
      <Loader visible={loading} text="Uploading..." />
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: colors.bgEnd,
    },
    flex: {
      flex: 1,
    },
    scrollViewContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      width: width - 40,
      padding: 20,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,1)",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
    },
    title: { fontSize: 32, fontWeight: "700", color: colors.primary },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 16,
      textAlign: "left",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    option: {
      flex: 1,
      alignItems: "center",
      padding: 12,
      marginHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.text,
      height: 150,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    optionText: { fontSize: 16, fontWeight: "600" },
    muted: { fontSize: 12, color: colors.muted, marginTop: 6, flexShrink: 1 },
    primaryButton: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 10,
      marginHorizontal: 20,
    },
    transcriptBox: {
      marginTop: 28,
      width: "100%",
      height: "70%",
      backgroundColor: colors.primary3,
      boxShadow: "0 6px 6px rgba(0,0,0,0.1)",
      borderRadius: 10,
      padding: 15,
    },
    transcriptTitle: { fontSize: 18, fontWeight: "700", marginBottom: 18 },
    transcriptText: { fontSize: 16, fontWeight: "600", color: colors.text },
    footerBtn: {
      alignItems: "center",
      justifyContent: "center",
      width: 50,
      height: 50,
      borderRadius: 40,
      borderColor: colors.muted2,
      borderWidth: 1,
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
    sourceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginLeft: 12,
      marginBottom: 140,
      width: width - 40,
    },
    fileNameText: { fontSize: 15, fontWeight: "400", color: colors.muted1 },
    sourceActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    playBtn: {
      alignItems: "center",
      justifyContent: "center",
      width: 35,
      height: 35,
      borderRadius: 30,
      backgroundColor: colors.cardBg,
      borderColor: colors.muted2,
      borderWidth: 1,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      width: "100%",
      maxWidth: 480,
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.muted2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 6,
    },
    selectedAudioChip: {
      backgroundColor: colors.muted2,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.muted2,
      maxWidth: "100%",
    },
    selectedAudioText: {
      color: colors.muted1,
      fontSize: 14,
    },
    uniqueIdChip: {
      backgroundColor: colors.muted2,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.muted2,
      maxWidth: "100%",
    },
    uniqueIdText: {
      color: colors.muted1,
      fontSize: 14,
      fontFamily: "monospace",
    },
    modalTextInput: {
      borderWidth: 1,
      borderColor: colors.muted2,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
      backgroundColor: colors.cardBg,
    },
    inputRow: {
      marginBottom: 20,
      color: colors.primary1,
    },
    label: {
      fontSize: 14,
      marginBottom: 8,
      color: colors.text,
      fontWeight: "600",
    },
    errorText: {
      color: colors.red,
      fontSize: 12,
      marginTop: 4,
    },
  });
