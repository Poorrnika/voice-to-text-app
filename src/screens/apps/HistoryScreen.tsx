import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import { useThemeColors } from "../../utils/ThemeContext";
import axiosInstance from "../../axios/interceptors";
import Loader from "../../utils/Loader";
import { AUDIO_HISTORY_API_URL } from "../../axios/apiUrl";
import Snackbar from "../../utils/Snackbar";
import { GENERAL_ERROR_MESSAGE } from "../../utils/constants";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AudioItem = {
  audio_id: string;
  case_id: string;
  original_filename: string;
  duration_seconds: number;
  category: string;
  status: string;
  media_url: string;
  transcript_url: string;
  created_at: string;
};

const AudioAccordionScreen = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioHistory, setAudioHistory] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(
    null,
  );
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [status, setStatus] = useState("");

  const soundRef = useRef<Audio.Sound | null>(null);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  // Format date from ISO string
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter audio items based on search query and sort by latest date
  const filteredAudioHistory = audioHistory
    .filter((item) => {
      const searchLower = searchQuery.toLowerCase();

      return (
        item.case_id.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by latest date first (descending order)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  // Fetch audio history from API whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchAudioHistory = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(
            `${process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL}${AUDIO_HISTORY_API_URL}`,
          );
          if (response.data) {
            setAudioHistory(response.data.audios);
          }
        } catch (error) {
          setLoading(false);
          const errorMessage =
            error instanceof Error ? error.message : GENERAL_ERROR_MESSAGE;
          console.error("Error fetching audio history:", errorMessage);
          setStatus(errorMessage);
          setShowSnackbar(true);
          // Fallback to empty data if API fails
          setAudioHistory([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAudioHistory();
    }, []),
  );

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const handlePlayPause = async (item: AudioItem) => {
    try {
      // Stop existing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If same item is clicked again → pause
      if (playingId === item.audio_id) {
        setPlayingId(null);
        return;
      }

      // Call the API to get the playable URL
      const response = await axiosInstance.get(
        `${process.env.EXPO_PUBLIC_MOBILE_APP_API_BASE_URL}/api/v1/ingest/media/${item.audio_id}/play`,
      );

      // Extract the media URL from the response
      const mediaUrl =
        response.data?.data?.media_url ||
        response.data?.media_url ||
        item.media_url;

      if (!mediaUrl) {
        console.error("No media URL returned from API");
        return;
      }

      const { sound } = await Audio.Sound.createAsync({
        uri: mediaUrl,
      });
      soundRef.current = sound;
      setPlayingId(item.audio_id);

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if ((status as AVPlaybackStatusSuccess).didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.warn("Audio playback error:", error);
    }
  };

  const renderItem = ({ item }: { item: AudioItem }) => {
    const isExpanded = expanded === item.audio_id;
    const isPlaying = playingId === item.audio_id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => toggleExpand(item.audio_id)}
          activeOpacity={0.9}
          style={styles.cardHeader}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => handlePlayPause(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.audioName} numberOfLines={1}>
                {item.case_id}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={22}
              color={colors.muted}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Case ID:</Text>
              <Text style={styles.detailValue}>{item.case_id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.created_at)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setExpandedTranscript(
                  expandedTranscript === item.audio_id ? null : item.audio_id,
                )
              }
              activeOpacity={0.7}
              style={styles.transcriptHeader}
            >
              <Text style={styles.label}>Transcription</Text>
              <Ionicons
                name={
                  expandedTranscript === item.audio_id
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={20}
                color={colors.muted}
              />
            </TouchableOpacity>

            {expandedTranscript === item.audio_id && (
              <View style={styles.transcriptSection}>
                <Text style={styles.transcribe}>{item.transcript_url}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={28} color={colors.cardBg} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Audio History
            </Text>
          </View>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.searchBarContainer}>
            <Ionicons
              name="search"
              size={20}
              color={colors.muted1}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search..."
              placeholderTextColor={colors.muted1}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.muted1} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <Loader visible={loading} text="Loading..." />
          ) : filteredAudioHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? "No audio records match your search"
                  : "No audio records found !"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredAudioHistory}
              keyExtractor={(item) => item.audio_id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
      <Snackbar visible={showSnackbar} message={status} color={colors} />
      <Loader visible={loading} text="Loading..." />
    </>
  );
};

export default AudioAccordionScreen;

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
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary3,
      borderRadius: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.muted2,
      height: 48,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 3,
      elevation: 2,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
    },
    clearButton: {
      padding: 6,
      marginLeft: 8,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      marginVertical: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: colors.text,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    audioName: {
      marginLeft: 10,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    caseId: {
      marginLeft: 10,
      fontSize: 12,
      fontWeight: "400",
      color: colors.muted1,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusBadge: {
      backgroundColor: colors.primary3,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    cardBody: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.muted2,
      paddingTop: 12,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      alignItems: "flex-start",
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.border,
      flex: 0.35,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: "400",
      color: colors.text,
      flex: 0.65,
      textAlign: "right",
    },
    transcriptSection: {
      marginTop: 8,
      borderTopColor: colors.muted2,
      paddingTop: 10,
    },
    transcriptHeader: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.muted2,
      paddingTop: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.border,
      marginBottom: 0,
    },
    transcribe: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "400",
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: colors.muted,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: colors.muted,
    },
  });
