import React from "react";
import { ActivityIndicator, Modal, View, Text, StyleSheet } from "react-native";
import { useThemeColors } from "./ThemeContext";
interface LoaderProps {
  visible: boolean;
  text?: string;
}

export default function Loader({ visible, text }: LoaderProps) {
  const colors = useThemeColors();

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          {text ? <Text style={styles.text}>{text}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  container: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
