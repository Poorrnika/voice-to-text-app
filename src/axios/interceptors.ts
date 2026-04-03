import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import { jwtDecode } from "jwt-decode";

const navigationRef = React.createRef<any>();
const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL, // CHANGE THIS
});

// Helper function to check if token is expired
const isTokenExpired = async (): Promise<boolean> => {
  const expiresIn = await AsyncStorage.getItem("expiresIn");
  if (!expiresIn) return true;
  const expiryTime = parseInt(expiresIn, 10);
  const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
  return currentTime >= expiryTime;
};

// Helper function to refresh the access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const deviceId = await AsyncStorage.getItem("deviceId");

    if (!token || !deviceId) {
      throw new Error("Missing token or device ID");
    }

    const refreshResponse = await axios.post(
      `${process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL}/api/v1/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "device-id": deviceId,
        },
      },
    );
    const newAccessToken = refreshResponse.data.access_token;
    const cleaned = refreshResponse.data.access_token
      .replace("Bearer ", "")
      .trim();
    const decoded: any = jwtDecode(cleaned);
    // Update tokens in AsyncStorage
    await AsyncStorage.setItem("accessToken", newAccessToken);
    await AsyncStorage.setItem("expiresIn", decoded.exp.toString());

    return newAccessToken;
  } catch (error) {
    console.log("❌ REFRESH TOKEN ERROR:", error);
    // Clear tokens and redirect to login
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("expiresIn");
    await AsyncStorage.removeItem("deviceId");
    navigationRef.current?.navigate("Login");
    return null;
  }
};

// ------------------------
// REQUEST INTERCEPTOR
// ------------------------
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    const deviceId = await AsyncStorage.getItem("deviceId");

    // Check if token is expired and refresh if needed
    const expired = await isTokenExpired();
    let accessToken = token;
    if (expired && token) {
      console.log("⚠️ Token expired, attempting to refresh...");
      accessToken = await refreshAccessToken();
    }

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (deviceId) {
      config.headers["device-id"] = deviceId;
    }

    return config;
  },
  (error) => {
    console.log("❌ REQUEST ERROR:", error);
    return Promise.reject(error);
  },
);

// ------------------------
// RESPONSE INTERCEPTOR
// ------------------------
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log("❌ RESPONSE ERROR:", JSON.stringify(error.message));
    // Handle 401 – Token expired or unauthorized
    if (error.response?.status === 401) {
      console.log("🔒 Unauthorized (401) → attempting token refresh");

      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        // Retry the original request with the new token
        const originalRequest = error.config;
        originalRequest.headers["Authorization"] = `Bearer ${refreshedToken}`;

        try {
          return axiosInstance(originalRequest);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
