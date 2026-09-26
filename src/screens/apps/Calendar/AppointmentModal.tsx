import React, {
  useEffect,
  useState,
} from "react";

import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Controller, useForm } from "react-hook-form";

import { Ionicons } from "@expo/vector-icons";

import * as DocumentPicker from "expo-document-picker";

import { Audio } from "expo-av";

import AudioRecorderService from "../../../utils/AudioRecorderService";

const AppointmentModal = ({
  visible,
  onClose,
  slot,
  appointment,
}: any) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      patientName:
        appointment?.patientName || "",

      purposeOfVisit:
        appointment?.purposeOfVisit || "",

      medicalHistory:
        appointment?.medicalHistory || "",
    },
  });

  const [recordUri, setRecordUri] =
    useState<string | null>(
      appointment?.audio || null,
    );

  const [isRecording, setIsRecording] =
    useState(false);

  const [sound, setSound] =
    useState<Audio.Sound | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  useEffect(() => {
    reset({
      patientName:
        appointment?.patientName || "",

      purposeOfVisit:
        appointment?.purposeOfVisit || "",

      medicalHistory:
        appointment?.medicalHistory || "",
    });

    setRecordUri(
      appointment?.audio || null,
    );
  }, [appointment]);

  const formValid =
    watch("patientName") &&
    watch("purposeOfVisit") &&
    watch("medicalHistory");

  const onRecordPress = async () => {
    if (!isRecording) {
      const result =
        await AudioRecorderService.startRecording();

      if (!result.success) return;

      setIsRecording(true);
    } else {
      const result =
        await AudioRecorderService.stopRecording();

      setIsRecording(false);

      if (result.uri) {
        setRecordUri(result.uri);
      }
    }
  };

  const onUploadPress = async () => {
    const res: any =
      await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

    if (res.assets?.length) {
      setRecordUri(res.assets[0].uri);
    }
  };

  const playAudio = async () => {
    if (!recordUri) return;

    if (sound && isPlaying) {
      await sound.stopAsync();

      setIsPlaying(false);

      return;
    }

    const { sound: s } =
      await Audio.Sound.createAsync(
        { uri: recordUri },
        { shouldPlay: true },
      );

    setSound(s);

    setIsPlaying(true);
  };

  const onCreate = async (data: any) => {
    const payload = {
      ...data,
      audio: recordUri,
      time: slot,
    };

    console.log(payload);

    // axios post here

    onClose();
  };

  const onCancel = () => {
    reset();

    setRecordUri(
      appointment?.audio || null,
    );

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "#111827",
          padding: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 20,
          }}
        >
          {slot}
        </Text>

        <Text style={{ color: "white" }}>
          Patient Name
        </Text>

        <Controller
          control={control}
          name="patientName"
          rules={{
            required:
              "Patient name required",
          }}
          render={({
            field: {
              onChange,
              value,
            },
          }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: 16,
                borderRadius: 14,
                marginTop: 8,
                marginBottom: 16,
              }}
            />
          )}
        />

        <Text style={{ color: "white" }}>
          Purpose
        </Text>

        <Controller
          control={control}
          name="purposeOfVisit"
          rules={{
            required:
              "Purpose required",
          }}
          render={({
            field: {
              onChange,
              value,
            },
          }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: 16,
                borderRadius: 14,
                marginTop: 8,
                marginBottom: 16,
              }}
            />
          )}
        />

        <Text style={{ color: "white" }}>
          Medical History
        </Text>

        <Controller
          control={control}
          name="medicalHistory"
          rules={{
            required:
              "Medical history required",
          }}
          render={({
            field: {
              onChange,
              value,
            },
          }) => (
            <TextInput
              multiline
              value={value}
              onChangeText={onChange}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: 16,
                borderRadius: 14,
                height: 120,
                marginTop: 8,
                marginBottom: 20,
              }}
            />
          )}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent:
              "space-around",
            marginVertical: 20,
          }}
        >
          <TouchableOpacity
            disabled={!formValid}
            onPress={onRecordPress}
          >
            <Ionicons
              name={
                isRecording
                  ? "stop"
                  : "mic"
              }
              size={40}
              color={
                formValid
                  ? "#3B82F6"
                  : "#6B7280"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!formValid}
            onPress={onUploadPress}
          >
            <Ionicons
              name="cloud-upload"
              size={40}
              color={
                formValid
                  ? "#10B981"
                  : "#6B7280"
              }
            />
          </TouchableOpacity>
        </View>

        {recordUri && (
          <TouchableOpacity
            onPress={playAudio}
            style={{
              backgroundColor: "#1F2937",
              padding: 16,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={
                isPlaying
                  ? "pause"
                  : "play"
              }
              size={26}
              color="white"
            />

            <Text
              style={{
                color: "white",
                marginLeft: 10,
              }}
            >
              {recordUri
                .split("/")
                .pop()}
            </Text>
          </TouchableOpacity>
        )}

        <View
          style={{
            flexDirection: "row",
            marginTop: 40,
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              padding: 18,
              backgroundColor: "#374151",
              borderRadius: 16,
              marginRight: 10,
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit(
              onCreate,
            )}
            style={{
              flex: 1,
              padding: 18,
              backgroundColor: "#2563EB",
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              {appointment
                ? "Update"
                : "Create"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default AppointmentModal;