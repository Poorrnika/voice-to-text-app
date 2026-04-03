import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LOGOUT_API_URL } from "../../axios/apiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, useThemeColors } from "../../utils/ThemeContext";
import Loader from "../../utils/Loader";
import axiosInstance from "../../axios/interceptors";
import { GENERAL_ERROR_MESSAGE, LOGOUT_TEXT } from "../../utils/constants";
import Snackbar from "../../utils/Snackbar";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { toggleTheme, theme } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [status, setStatus] = useState("");

  const handleToggleTheme = () => toggleTheme();

  useEffect(() => {
    const getUserData = async () => {
      const emailId: any = await AsyncStorage.getItem("emailId");
      const fullName: any = await AsyncStorage.getItem("fullName");
      const accountType: any = await AsyncStorage.getItem("accountType");
      setEmail(emailId);
      setName(fullName);
      setAccountType(accountType);
    };
    getUserData();
  });

  const handleLogout = async () => {
    setLoading(true);
    const deviceId = await AsyncStorage.getItem("deviceId");
    await axiosInstance
      .post(process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL + LOGOUT_API_URL, {
        headers: {
          "device-id": deviceId,
        },
      })
      .then(async () => {
        setLoading(false);
        await AsyncStorage.removeItem("accessToken");
        navigation.navigate("Welcome");
      })
      .catch((err: any) => {
        setLoading(false);
        const errorMessage =
          err instanceof Error ? err.message : GENERAL_ERROR_MESSAGE;
        console.log("Error while logging out:", errorMessage);
        setStatus(errorMessage);
        setShowSnackbar(true);
      });
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.bgEnd }]}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="settings" size={24} color={colors.cardBg} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* User Info Card */}
          <View style={styles.card}>
            <View style={styles.userRow}>
              <MaterialIcons name="person" size={28} color={colors.primary} />
              <View>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.userEmail}>{email}</Text>
              </View>
            </View>
          </View>

          {/* Account Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Account Type</Text>
              <Text style={[styles.label, { fontWeight: 500 }]}>
                {accountType}
              </Text>
            </View>
          </View>

          {/* Preferences Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Dark Theme</Text>
              <Switch
                value={theme === "dark"}
                onValueChange={handleToggleTheme}
              />
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color={colors.cardBg} />
            <Text style={styles.logoutText}>{LOGOUT_TEXT}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Snackbar visible={showSnackbar} message={status} color={colors} />
      <Loader visible={loading} text="Logging out..." />
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgEnd,
    },
    headerContainer: {
      backgroundColor: colors.cardBg,
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.muted2,
      shadowColor: colors.text,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    card: {
      backgroundColor: colors.primary3,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    userName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    userEmail: {
      fontSize: 14,
      color: colors.muted,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    label: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    logoutBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 40,
      gap: 12,
    },
    logoutText: {
      color: colors.cardBg,
      fontSize: 16,
      fontWeight: "700",
    },
  });
