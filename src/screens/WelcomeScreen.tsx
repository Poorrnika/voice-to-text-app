import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import WelcomeSVGComponent from "../../assets/svg/WelcomeScreenSvg";
import { useThemeColors } from "../utils/ThemeContext";
import {
  APP_NAME,
  CREATE_ACCOUNT_BUTTON_TEXT,
  LOGIN_TEXT,
} from "../utils/constants";

const { width } = Dimensions.get("window");

function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, styles.gradient]}>
      {/* <View style={styles.topGap} /> */}
      {/* <WelcomeSVGComponent width={400} height={400} /> */}
      <Image
        source={require("../../assets/favicon.jpeg")}
        style={styles.logoContainer}
      />
      {/* <Text style={styles.title}>Welcome to {APP_NAME}</Text> */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("SignUp")}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>
          {CREATE_ACCOUNT_BUTTON_TEXT}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.glassButton}
        onPress={() => navigation.navigate("Login")}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Text style={styles.ghostButtonText}>{LOGIN_TEXT}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default WelcomeScreen;

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.bgEnd,
    },
    gradient: {
      justifyContent: "center",
      alignItems: "center",
    },
    logoContainer: {
      width: 310,
      height: 310,
      marginBottom: 80,
      borderRadius: 15,
      boxShadow: `0 4px 12px ${colors.shadow}`,
      marginTop: -60,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      marginVertical: 24,
      marginBottom: 32,
      textAlign: "center",
      color: colors.text,
    },
    input: {
      borderColor: "#ddd",
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    button: {
      backgroundColor: "#0a84ff",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: { color: "#fff", fontWeight: "600" },
    topGap: {},
    illustrationCard: {
      width: width - 60,
      height: 400,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    illusBox: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colors.bgEnd,
      alignItems: "center",
      justifyContent: "center",
    },
    illusEmoji: {
      fontSize: 72,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 32,
      paddingHorizontal: 12,
      fontStyle: "italic",
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 12,
      width: "90%",
    },
    primaryButtonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    ghostButton: {
      borderColor: colors.primary,
      borderWidth: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 24,
      width: "90%",
    },
    ghostButtonText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 16,
    },
    glassButton: {
      width: "90%",
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary,
      overflow: "hidden",
      marginTop: 8,
    },
    buttonHighlight: {
      ...StyleSheet.absoluteFillObject,
      height: 48,
      top: 0,
      left: 0,
      opacity: 0.9,
      pointerEvents: "none",
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    smallText: {
      fontSize: 14,
      color: colors.muted,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
