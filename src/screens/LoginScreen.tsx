import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import WelcomeScreenSvg from "../../assets/svg/WelcomeScreenSvg";
import { LOGIN_API_URL } from "../axios/apiUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useForm, Controller } from "react-hook-form";
import { useThemeColors } from "../utils/ThemeContext";
import Loader from "../utils/Loader";
import axiosInstance from "../axios/interceptors";
import Snackbar from "../utils/Snackbar";
import { jwtDecode } from "jwt-decode";
import {
  LOGIN_WELCOME_TEXT,
  LOGIN_TEXT,
  LOGIN_SUCCESS_MESSAGE,
  LOGIN_ERROR_MESSAGE,
} from "../utils/constants";

const deviceType = Platform.OS;

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      remember: "",
    },
  });

  const generateRandom10Digit = (): number => {
    const min = 1000000000;
    const max = 9999999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const onLogin = async (data: any) => {
    setLoading(true);
    const device_id = generateRandom10Digit().toString();
    const loginData = {
      username: data.email,
      password: data.password,
      device_type: deviceType,
      device_id: device_id,
    };
    AsyncStorage.setItem("deviceId", device_id);
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const formBody = Object.entries(loginData)
      .map(
        ([key, value]) =>
          encodeURIComponent(key) + "=" + encodeURIComponent(value),
      )
      .join("&");

    await axiosInstance
      .post(
        process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL + LOGIN_API_URL,
        formBody,
        {
          headers: headers,
        },
      )
      .then(async (response) => {
        setLoading(false);
        setStatus(LOGIN_SUCCESS_MESSAGE);
        setShowSnackbar(true);
        AsyncStorage.setItem("accessToken", response.data.access_token);
        AsyncStorage.setItem("fullName", response.data.fullname);
        AsyncStorage.setItem("accountType", response.data.account_type);
        const cleaned = response.data.access_token
          .replace("Bearer ", "")
          .trim();
        const decoded: any = jwtDecode(cleaned);
        AsyncStorage.setItem("expiresIn", decoded.exp.toString());
        AsyncStorage.setItem("emailId", decoded.sub);
        navigation.navigate("Home");
      })
      .catch((err) => {
        setLoading(false);
        setStatus((err.message || LOGIN_ERROR_MESSAGE));
        setShowSnackbar(true);
        console.log("Error while logging in", JSON.stringify(err.message));
      });
  };

  return (
    <>
      <LinearGradient
        colors={[colors.accent1, colors.primary1, colors.accent1]}
        style={styles.root}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0.02)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={styles.screenMirror}
        />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: "height" })}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 70}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons
                      name="arrow-back-ios"
                      size={22}
                      color="#444444ff"
                    />
                  </TouchableOpacity>
                </View>
                <WelcomeScreenSvg width={250} height={250} />
              </View>
              <BlurView intensity={50} tint="light" style={{ flex: 1 }}>
                <ScrollView
                  style={styles.card}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.cardTitle}>{LOGIN_WELCOME_TEXT}</Text>

                  <View style={styles.inputRow}>
                    <Text style={styles.label}>
                      Email <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <Controller
                      control={control}
                      name="email"
                      rules={{
                        required: "Email is required",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Enter a valid email",
                        },
                      }}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          placeholderTextColor="#bbb"
                          placeholder="Enter email"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          style={styles.input}
                        />
                      )}
                    />
                    {errors.email && (
                      <Text style={{ color: colors.red, marginTop: 4 }}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.label}>
                      Password <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <View
                      style={[
                        styles.input,
                        {
                          flexDirection: "row",
                          justifyContent: "space-between",
                        },
                      ]}
                    >
                      <Controller
                        control={control}
                        name="password"
                        rules={{ required: "Password is required" }}
                        render={({ field: { onChange, value } }) => (
                          <>
                            <TextInput
                              value={value}
                              onChangeText={onChange}
                              placeholder="Enter password"
                              secureTextEntry={!showPassword}
                              placeholderTextColor="#bbb"
                              style={{
                                color: colors.text,
                                fontSize: 16,
                                width: "90%",
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => setShowPassword(!showPassword)}
                              accessibilityRole="button"
                              style={{ alignSelf: "flex-end" }}
                            >
                              <Ionicons
                                name={
                                  !showPassword
                                    ? "eye-off-outline"
                                    : "eye-outline"
                                }
                                size={18}
                                color="#a6a6a6"
                              />
                            </TouchableOpacity>
                          </>
                        )}
                      />
                    </View>

                    {errors.password && (
                      <Text style={{ color: colors.red, marginTop: 4 }}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleSubmit(onLogin)}
                  >
                    <Text style={styles.primaryBtnText}>{LOGIN_TEXT}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </BlurView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Snackbar visible={showSnackbar} message={status} color={colors} />
      <Loader visible={loading} text="Logging in..." />
    </>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    headerRow: {
      position: "absolute",
      top: 20,
      left: 20,
    },
    card: {
      backgroundColor: colors.bgEnd,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
      marginHorizontal: 20,
      width: "100%",
      height: "100%",
      alignSelf: "center",
      shadowColor: colors.text,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },

    screenBlur: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },

    screenMirror: {
      position: "absolute",
      top: -40,
      left: -40,
      width: width + 80,
      height: 180,
      transform: [{ rotate: "-10deg" }],
      opacity: 0.9,
      pointerEvents: "none",
    },
    cardTitle: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 30,
      textAlign: "center",
      color: colors.text,
    },
    inputRow: {
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      marginBottom: 6,
      color: colors.text,
    },
    input: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    rememberRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#aaa",
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxChecked: {
      borderColor: "#0a84ff",
    },
    checkboxDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#0a84ff",
    },
    rememberText: {
      fontSize: 14,
      color: "#333",
    },
    forgotText: {
      fontSize: 14,
      color: "#0a84ff",
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      padding: 14,
      marginTop: 30,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 20,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: "#ddd",
    },
    dividerText: {
      marginHorizontal: 10,
      fontSize: 14,
      color: "#555",
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
    },
    socialBtn: {
      marginHorizontal: 15,
    },
  });
