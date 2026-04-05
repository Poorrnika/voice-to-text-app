import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import WelcomeScreenSvg from "../../assets/svg/WelcomeScreenSvg";
import { SIGNUP_API_URL } from "../axios/apiUrl";
import { useForm, Controller } from "react-hook-form";
import { useThemeColors } from "../utils/ThemeContext";
import Loader from "../utils/Loader";
import axiosInstance from "../axios/interceptors";
import Snackbar from "../utils/Snackbar";
import {
  CREATE_ACCOUNT_TEXT,
  CREATE_ACCOUNT_BUTTON_TEXT,
  CREATE_ACCOUNT_SUCCESS_MESSAGE,
  CREATE_ACCOUNT_ERROR_MESSAGE,
} from "../utils/constants";

const { width } = Dimensions.get("window");

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [status, setStatus] = useState("");
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const passwordValue = watch("password");

  async function onSubmit(data: any) {
    setLoading(true);
    const signupData: any = {
      fullname: data.name,
      email: data.email,
      password: data.password,
    };

    const headers = {
      "Content-Type": "application/json",
    };
    await axiosInstance
      .post(
        process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL + SIGNUP_API_URL,
        JSON.stringify(signupData),
        {
          headers: headers,
        },
      )
      .then(() => {
        setLoading(false);
        setStatus(CREATE_ACCOUNT_SUCCESS_MESSAGE);
        setShowSnackbar(true);
        setShowPassword(false);
        navigation.navigate("Login");
        reset();
      })
      .catch((err) => {
        setLoading(false);
        setStatus(err.message || CREATE_ACCOUNT_ERROR_MESSAGE);
        setShowSnackbar(true);
        console.log("Error occured while signing up", JSON.stringify(err));
        reset();
      });
  }

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
          keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 68}
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
                {/* <WelcomeScreenSvg width={250} height={250} /> */}
                <Image
                  source={require("../../assets/favicon.jpeg")}
                  style={styles.logoContainer}
                />
              </View>
              <BlurView intensity={50} tint="light" style={{ flex: 1 }}>
                <ScrollView
                  style={styles.card}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.cardTitle}>{CREATE_ACCOUNT_TEXT}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Full name <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <View style={styles.inputRow}>
                      <Controller
                        control={control}
                        name="name"
                        rules={{
                          required: "Name is required",
                          minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters",
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            placeholderTextColor="#bbb"
                            placeholder="Enter Full Name"
                            autoCapitalize="none"
                            style={styles.input}
                          />
                        )}
                      />
                    </View>
                    {errors.name && (
                      <Text style={{ color: colors.red, marginTop: 4 }}>
                        {errors.name.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Email <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <View style={styles.inputRow}>
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
                    </View>
                    {errors.email && (
                      <Text style={{ color: colors.red, marginTop: 4 }}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Password <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <View style={styles.inputRow}>
                      <Controller
                        control={control}
                        name="password"
                        rules={{
                          required: "Password is required",
                          minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters",
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <>
                            <TextInput
                              value={value}
                              onChangeText={onChange}
                              placeholder="Enter password"
                              secureTextEntry={!showPassword}
                              style={styles.input}
                              placeholderTextColor="#bbb"
                            />
                            <TouchableOpacity
                              onPress={() => setShowPassword(!showPassword)}
                              accessibilityRole="button"
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Confirm Password{" "}
                      <Text style={{ color: colors.red }}>{"*"}</Text>
                    </Text>
                    <View style={styles.inputRow}>
                      <Controller
                        control={control}
                        name="confirm"
                        rules={{
                          required: "Confirm Password is required",
                          validate: (value) =>
                            value === passwordValue || "Passwords do not match",
                        }}
                        render={({ field: { onChange, value } }) => (
                          <>
                            <TextInput
                              value={value}
                              onChangeText={onChange}
                              placeholder="Re-enter password"
                              secureTextEntry={!showConfirmPassword}
                              style={styles.input}
                              placeholderTextColor="#bbb"
                            />
                            <TouchableOpacity
                              onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              accessibilityRole="button"
                            >
                              <Ionicons
                                name={
                                  !showConfirmPassword
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
                    {errors.confirm && (
                      <Text style={{ color: colors.red, marginTop: 4 }}>
                        {errors.confirm.message}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit(onSubmit)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.submitButtonText}>
                      {CREATE_ACCOUNT_BUTTON_TEXT}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </BlurView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
      <Snackbar visible={showSnackbar} message={status} color={colors} />
      <Loader visible={loading} text="Loading..." />
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
      overflow: "scroll",
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
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 20,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "600",
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
    inputGroup: {
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: "#fff",
      width: "100%",
    },
    input: {
      flex: 1,
      height: 40,
      marginLeft: 8,
      color: "#333",
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
      width: "100%",
    },
    submitButtonText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
    },
    logoContainer: {
      width: 210,
      height: 210,
      marginBottom: 30,
      borderRadius: 15,
      boxShadow: `0 4px 12px ${colors.shadow}`,
      marginTop: 20,
    },
  });
