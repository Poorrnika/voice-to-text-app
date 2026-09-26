// // import React, {
// //   useMemo,
// //   useState,
// // } from "react";

// // import {
// //   FlatList,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";

// // import moment from "moment";

// // import appointments from "../../../mocks/appointments.json";

// // import AppointmentModal from "./AppointmentModal";

// // const generateTimeSlots = () => {
// //   const slots = [];

// //   for (let i = 0; i < 24; i++) {
// //     const hour = i % 12 || 12;

// //     const suffix = i < 12 ? "AM" : "PM";

// //     slots.push(
// //       `${hour.toString().padStart(2, "0")}:00 ${suffix}`,
// //     );
// //   }

// //   return slots;
// // };

// // const CalendarScreen = () => {
// //   const [selectedDate, setSelectedDate] =
// //     useState(moment());

// //   const [selectedSlot, setSelectedSlot] =
// //     useState<string | null>(null);

// //   const [selectedAppointment, setSelectedAppointment] =
// //     useState<any>(null);

// //   const slots = useMemo(
// //     () => generateTimeSlots(),
// //     [],
// //   );

// //   const nextDay = () => {
// //     setSelectedDate((prev) =>
// //       moment(prev).add(1, "day"),
// //     );
// //   };

// //   const prevDay = () => {
// //     setSelectedDate((prev) =>
// //       moment(prev).subtract(1, "day"),
// //     );
// //   };

// //   const openCreate = (slot: string) => {
// //     const existing = appointments.find(
// //       (a:any) => a.time === slot,
// //     );

// //     setSelectedSlot(slot);

// //     setSelectedAppointment(existing || null);
// //   };

// //   return (
// //     <View style={{ flex: 1, backgroundColor: "#111827" }}>
// //       <View
// //         style={{
// //           flexDirection: "row",
// //           justifyContent: "space-between",
// //           padding: 20,
// //         }}
// //       >
// //         <TouchableOpacity onPress={prevDay}>
// //           <Text style={{ color: "white" }}>
// //             Previous
// //           </Text>
// //         </TouchableOpacity>

// //         <Text
// //           style={{
// //             color: "white",
// //             fontSize: 20,
// //             fontWeight: "700",
// //           }}
// //         >
// //           {selectedDate.format("DD MMM YYYY")}
// //         </Text>

// //         <TouchableOpacity onPress={nextDay}>
// //           <Text style={{ color: "white" }}>
// //             Next
// //           </Text>
// //         </TouchableOpacity>
// //       </View>

// //       <FlatList
// //         data={slots}
// //         keyExtractor={(item) => item}
// //         renderItem={({ item }) => {
// //           const existing =
// //             appointments.find(
// //               (a:any) => a.time === item,
// //             );

// //           return (
// //             <TouchableOpacity
// //               onPress={() =>
// //                 openCreate(item)
// //               }
// //               style={{
// //                 padding: 20,
// //                 borderBottomWidth: 1,
// //                 borderColor: "#1F2937",
// //                 backgroundColor: existing
// //                   ? "#1E3A8A"
// //                   : "#111827",
// //               }}
// //             >
// //               <Text
// //                 style={{
// //                   color: "white",
// //                   fontSize: 16,
// //                 }}
// //               >
// //                 {item}
// //               </Text>

// //               {existing && (
// //                 <Text
// //                   style={{
// //                     color: "#93C5FD",
// //                     marginTop: 6,
// //                   }}
// //                 >
// //                   {existing.patientName}
// //                 </Text>
// //               )}
// //             </TouchableOpacity>
// //           );
// //         }}
// //       />

// //       <AppointmentModal
// //         visible={!!selectedSlot}
// //         slot={selectedSlot}
// //         appointment={selectedAppointment}
// //         onClose={() => {
// //           setSelectedSlot(null);

// //           setSelectedAppointment(null);
// //         }}
// //       />
// //     </View>
// //   );
// // };

// // export default CalendarScreen;

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Modal,
//   TextInput,
//   FlatList,
//   Dimensions,
// } from "react-native";
// import * as KeepAwake from "expo-keep-awake";
// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system/legacy";
// import * as DocumentPicker from "expo-document-picker";
// import dayjs from "dayjs";
// import { Ionicons, Octicons, Feather } from "@expo/vector-icons";
// import { Controller, useForm } from "react-hook-form";
// import { useThemeColors } from "../../../utils/ThemeContext";
// import Snackbar from "../../../utils/Snackbar";
// import AudioService from "../../../utils/AudioService";

// const MOCK_APPOINTMENTS = [
//   {
//     id: "1",
//     time: "09:00 AM",
//     patientName: "John Doe",
//     purposeOfVisit: "General Consultation",
//     medicalHistory: "Diabetes",
//     audioName: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
//   },
//   {
//     id: "2",
//     time: "01:00 PM",
//     patientName: "Emma Watson",
//     purposeOfVisit: "Fever",
//     medicalHistory: "Asthma",
//     audioName: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
//   },
// ];

// type AppointmentForm = {
//   patientName: string;
//   purposeOfVisit: string;
//   medicalHistory: string;
// };

// const SCREEN_WIDTH = Dimensions.get("window").width;

// // Very large virtual range
// const INITIAL_INDEX = 5000;

// export default function OutlookStyleCalendarScreen({ navigation }: any) {
//   const [selectedDate, setSelectedDate] = useState(dayjs());
//   const [selectedSlot, setSelectedSlot] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
//   const [status, setStatus] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showSnackbar, setShowSnackbar] = useState(false);
//   const [recordedAudio, setRecordedAudio] = useState<any>(null);
//   const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
//   const [recording, setRecording] = React.useState<Audio.Recording | null>(
//     null,
//   );
//   const [isRecording, setIsRecording] = useState<boolean>(false);
//   const [recordUri, setRecordUri] = React.useState<string | null>(null);
//   const [transcribedText, setTranscribedText] = React.useState<string | null>(
//     null,
//   );
//   const [sound, setSound] = React.useState<Audio.Sound | null>(null);
//   const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
//   const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
//   const [fileBlob, setFileBlob] = React.useState<any | null>(null);
//   const [mode, setMode] = useState<"speech" | "file">("speech");

//   const {
//     control,
//     handleSubmit,
//     watch,
//     reset,
//     setValue,
//     formState: { errors, isValid },
//   } = useForm<AppointmentForm>({
//     mode: "onChange",
//     defaultValues: {
//       patientName: "",
//       purposeOfVisit: "",
//       medicalHistory: "",
//     },
//   });

//   const colors = useThemeColors();
//   const styles = createStyles(colors);

//   const patientName = watch("patientName");
//   const purpose = watch("purposeOfVisit");

//   const isFormComplete =
//     patientName?.trim()?.length > 2 && purpose?.trim()?.length > 2;

//   const flatListRef = useRef<FlatList>(null);

//   // Virtualized weeks
//   const weeks = useMemo(() => {
//     return Array.from({
//       length: 10000,
//     }).map((_, index) => {
//       const weekOffset = index - INITIAL_INDEX;

//       const weekStart = dayjs().startOf("week").add(weekOffset, "week");

//       return Array.from({
//         length: 7,
//       }).map((__, dayIndex) => weekStart.add(dayIndex, "day"));
//     });
//   }, []);

//   const renderWeek = ({ item }: any) => {
//     return (
//       <View
//         style={{
//           width: SCREEN_WIDTH,
//           flexDirection: "row",
//           justifyContent: "space-around",
//           // paddingHorizontal: 12,
//         }}
//       >
//         {item.map((date: any) => {
//           const isSelected = selectedDate.isSame(date, "day");

//           const isToday = dayjs().isSame(date, "day");

//           return (
//             <TouchableOpacity
//               key={date.toString()}
//               onPress={() => setSelectedDate(date)}
//               style={[
//                 styles.dateCircle,
//                 {
//                   backgroundColor: isSelected
//                     ? "#fff"
//                     : isToday
//                       ? "rgba(255,255,255,0.08)"
//                       : "transparent",
//                 },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.dayName,
//                   {
//                     color: isSelected ? colors.primary : "#fff",
//                   },
//                 ]}
//               >
//                 {date.format("dd")}
//               </Text>

//               <Text
//                 style={[
//                   styles.dayNumber,
//                   {
//                     color: isSelected ? colors.primary : "#fff",
//                   },
//                 ]}
//               >
//                 {date.format("D")}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>
//     );
//   };

//   // -----------------------------------
//   // WEEK HEADER
//   // -----------------------------------

//   const weekDates = useMemo(() => {
//     const start = selectedDate.startOf("week");

//     return Array.from({ length: 7 }).map((_, index) => start.add(index, "day"));
//   }, [selectedDate]);

//   // -----------------------------------
//   // TIMESLOTS
//   // -----------------------------------

//   const timeSlots = useMemo(() => {
//     const slots = [];

//     for (let hour = 0; hour < 24; hour++) {
//       const period = hour >= 12 ? "PM" : "AM";
//       const displayHour = hour % 12 || 12;

//       slots.push(`${displayHour}:00 ${period}`);
//     }

//     return slots;
//   }, []);

//   // -----------------------------------
//   // OPEN SLOT
//   // -----------------------------------

//   const openAppointmentForm = (slot: string) => {
//     setSelectedSlot(slot);
//     setShowModal(true);
//   };

//   // -----------------------------------
//   // CREATE APPOINTMENT
//   // -----------------------------------

//   const createAppointment = (data: AppointmentForm) => {
//     const payload = {
//       id: Date.now().toString(),
//       date: selectedDate.format("YYYY-MM-DD"),
//       slot: selectedSlot,
//       patientName: data.patientName,
//       purposeOfVisit: data.purposeOfVisit,
//       medicalHistory: data.medicalHistory,
//       audioName: recordedAudio?.name || null,
//     };

//     setAppointments((prev: any) => [...prev, payload]);

//     reset();

//     setRecordedAudio(null);

//     setShowModal(false);
//   };

//   // -----------------------------------
//   // GET APPOINTMENT
//   // -----------------------------------

//   const getAppointmentForSlot = (slot: string) => {
//     return appointments.find(
//       (item: any) =>
//         item.slot === slot && item.date === selectedDate.format("YYYY-MM-DD"),
//     );
//   };

//   const cancelFile = async () => {
//     try {
//       if (sound) {
//         await sound.stopAsync();
//         await sound.unloadAsync();
//         setSound(null);
//       }
//       // Deactivate keep awake when cancelling
//       if (isRecording) {
//         await KeepAwake.deactivateKeepAwake();
//       }
//     } catch (e) {}
//     setSelectedFile(null);
//     setRecordUri(null);
//     setTranscribedText(null);
//     setIsRecording(false);
//     setRecording(null);
//     setIsPlaying(false);
//   };

//   const playAudio = async () => {
//     try {
//       const uri = recordUri;
//       if (!uri) return;

//       if (sound && isPlaying) {
//         await sound.stopAsync();
//         await sound.unloadAsync();
//         setIsPlaying(false);
//         setSound(null);
//         return;
//       }

//       const { sound: s } = await Audio.Sound.createAsync(
//         { uri },
//         { shouldPlay: true },
//       );
//       setSound(s);
//       setIsPlaying(true);
//       s.setOnPlaybackStatusUpdate((status: any) => {
//         if (status.didJustFinish) {
//           setIsPlaying(false);
//           s.unloadAsync();
//           setSound(null);
//         }
//       });
//     } catch (err) {
//       console.warn("play error", err);
//       setStatus("❌ Playback error");
//       setShowSnackbar(true);
//     }
//   };

//   return (
//     <>
//       <View
//         style={[
//           styles.container,
//           {
//             backgroundColor: colors.bgStart,
//           },
//         ]}
//       >
//         {/* HEADER */}

//         <View
//           style={[
//             styles.header,
//             {
//               backgroundColor: colors.primary,
//             },
//           ]}
//         >
//           <Text style={styles.monthText}>
//             {selectedDate.format("MMMM YYYY")}
//           </Text>

//           {/* WEEK STRIP */}

//           <View style={styles.weekContainer}>
//             <View>
//               <FlatList
//                 ref={flatListRef}
//                 horizontal
//                 pagingEnabled
//                 data={weeks}
//                 initialScrollIndex={INITIAL_INDEX}
//                 renderItem={renderWeek}
//                 keyExtractor={(_, index) => index.toString()}
//                 showsHorizontalScrollIndicator={false}
//                 getItemLayout={(_, index) => ({
//                   length: SCREEN_WIDTH,
//                   offset: SCREEN_WIDTH * index,
//                   index,
//                 })}
//                 initialNumToRender={3}
//                 maxToRenderPerBatch={6}
//                 windowSize={6}
//                 removeClippedSubviews
//               />

//               {/* Selected Date Header */}

//               {/* <View
//                 style={{
//                   marginTop: 18,
//                   alignItems: "center",
//                 }}
//               >
//                 <Text
//                   style={{
//                     color: "#fff",
//                     fontSize: 18,
//                     fontWeight: "700",
//                   }}
//                 >
//                   {selectedDate.format("dddd, MMMM D YYYY")}
//                 </Text>
//               </View> */}
//             </View>
//             {/* {weekDates.map((date) => {
//               const isSelected = date.isSame(selectedDate, "day");

//               return (
//                 <TouchableOpacity
//                   key={date.toString()}
//                   onPress={() => setSelectedDate(date)}
//                   style={[
//                     styles.dateCircle,
//                     {
//                       backgroundColor: isSelected ? "#fff" : "transparent",
//                     },
//                   ]}
//                 >
//                   <Text
//                     style={[
//                       styles.dayName,
//                       {
//                         color: isSelected ? colors.primary : "#fff",
//                       },
//                     ]}
//                   >
//                     {date.format("dd")}
//                   </Text>

//                   <Text
//                     style={[
//                       styles.dayNumber,
//                       {
//                         color: isSelected ? colors.primary : "#fff",
//                       },
//                     ]}
//                   >
//                     {date.format("D")}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })} */}
//           </View>
//         </View>

//         {/* DAILY CALENDAR */}

//         <ScrollView
//           style={{
//             flex: 1,
//           }}
//         >
//           {timeSlots.map((slot) => {
//             const appointment = getAppointmentForSlot(slot);

//             return (
//               <TouchableOpacity
//                 key={slot}
//                 style={[
//                   styles.timeSlotRow,
//                   {
//                     borderBottomColor: colors.border,
//                   },
//                 ]}
//                 onPress={() => openAppointmentForm(slot)}
//                 activeOpacity={0.8}
//               >
//                 {/* TIME */}

//                 <View style={styles.timeColumn}>
//                   <Text
//                     style={[
//                       styles.timeText,
//                       {
//                         color: colors.muted,
//                       },
//                     ]}
//                   >
//                     {slot}
//                   </Text>
//                 </View>

//                 {/* SLOT CONTENT */}

//                 <View
//                   style={[
//                     styles.slotContent,
//                     {
//                       backgroundColor: appointment ? "#DCEEFF" : "transparent",
//                     },
//                   ]}
//                 >
//                   {appointment && (
//                     <>
//                       <Text style={styles.appointmentTitle}>
//                         {appointment.patientName}
//                       </Text>

//                       <Text style={styles.appointmentSub}>
//                         {appointment.purposeOfVisit}
//                       </Text>

//                       <Text style={styles.appointmentSub}>
//                         {appointment.medicalHistory}
//                       </Text>

//                       {appointment.audioName && (
//                         <View style={styles.audioBadge}>
//                           <Ionicons
//                             name="play-circle"
//                             size={16}
//                             color="#007AFF"
//                           />

//                           <Text style={styles.audioText}>
//                             {appointment.audioName}
//                           </Text>
//                         </View>
//                       )}
//                     </>
//                   )}
//                 </View>
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>

//         {/* FLOATING BUTTON */}

//         {/* <TouchableOpacity
//           style={[
//             styles.fab,
//             {
//               backgroundColor: colors.primary,
//             },
//           ]}
//         >
//           <Ionicons name="add" size={28} color="#fff" />
//         </TouchableOpacity> */}

//         {/* CREATE APPOINTMENT MODAL */}

//         <Modal visible={showModal} animationType="slide">
//           <View
//             style={[
//               styles.modalContainer,
//               {
//                 backgroundColor: colors.bgStart,
//               },
//             ]}
//           >
//             {/* HEADER */}

//             <View style={styles.modalHeader}>
//               <TouchableOpacity
//                 onPress={() => {
//                   setShowModal(false);
//                   reset();
//                 }}
//               >
//                 <Ionicons name="close" size={28} color={colors.text} />
//               </TouchableOpacity>

//               <Text
//                 style={[
//                   styles.modalTitle,
//                   {
//                     color: colors.text,
//                   },
//                 ]}
//               >
//                 New Appointment
//               </Text>

//               <View style={{ width: 28 }} />
//             </View>

//             {/* SELECTED SLOT */}

//             <View
//               style={[
//                 styles.slotBadge,
//                 {
//                   backgroundColor: colors.primary,
//                 },
//               ]}
//             >
//               <Text style={styles.slotBadgeText}>
//                 {selectedDate.format("ddd, MMM D")} • {selectedSlot}
//               </Text>
//             </View>

//             <ScrollView>
//               {/* PATIENT NAME */}

//               <Text
//                 style={[
//                   styles.label,
//                   {
//                     color: colors.text,
//                   },
//                 ]}
//               >
//                 Patient Name *
//               </Text>

//               <Controller
//                 control={control}
//                 name="patientName"
//                 rules={{
//                   required: "Patient name is required",
//                   minLength: {
//                     value: 3,
//                     message: "Patient name must be at least 3 characters",
//                   },
//                 }}
//                 render={({ field: { onChange, value, onBlur } }) => (
//                   <TextInput
//                     value={value}
//                     onChangeText={onChange}
//                     placeholder="Enter patient name"
//                     placeholderTextColor={colors.muted}
//                     onBlur={onBlur}
//                     style={[
//                       styles.input,
//                       {
//                         color: colors.text,
//                         backgroundColor: colors.cardBg,
//                         borderColor: errors.patientName ? "red" : colors.border,
//                       },
//                     ]}
//                   />
//                 )}
//               />

//               {errors.patientName && (
//                 <Text style={styles.error}>{errors.patientName.message}</Text>
//               )}

//               {/* PURPOSE */}

//               <Text
//                 style={[
//                   styles.label,
//                   {
//                     color: colors.text,
//                   },
//                 ]}
//               >
//                 Purpose of Visit *
//               </Text>

//               <Controller
//                 control={control}
//                 name="purposeOfVisit"
//                 rules={{
//                   required: "Purpose of visit is required",
//                   minLength: {
//                     value: 5,
//                     message: "Purpose must be at least 5 characters",
//                   },
//                 }}
//                 render={({ field: { onChange, value, onBlur } }) => (
//                   <TextInput
//                     value={value}
//                     onChangeText={onChange}
//                     placeholder="Purpose of visit"
//                     placeholderTextColor={colors.muted}
//                     onBlur={onBlur}
//                     style={[
//                       styles.input,
//                       {
//                         color: colors.text,
//                         backgroundColor: colors.cardBg,
//                         borderColor: errors.purposeOfVisit
//                           ? "red"
//                           : colors.border,
//                       },
//                     ]}
//                   />
//                 )}
//               />

//               {errors.purposeOfVisit && (
//                 <Text style={styles.error}>
//                   {errors.purposeOfVisit.message}
//                 </Text>
//               )}

//               {/* HISTORY */}

//               <Text
//                 style={[
//                   styles.label,
//                   {
//                     color: colors.text,
//                   },
//                 ]}
//               >
//                 Medical History
//               </Text>

//               <Controller
//                 control={control}
//                 name="medicalHistory"
//                 rules={{
//                   maxLength: {
//                     value: 10,
//                     message: "Medical history cannot exceed 10 characters",
//                   },
//                 }}
//                 render={({ field: { onChange, value, onBlur } }) => (
//                   <TextInput
//                     multiline
//                     numberOfLines={4}
//                     value={value}
//                     onChangeText={onChange}
//                     placeholder="Medical history"
//                     placeholderTextColor={colors.muted}
//                     onBlur={onBlur}
//                     style={[
//                       styles.textArea,
//                       {
//                         color: colors.text,
//                         backgroundColor: colors.cardBg,
//                         borderColor: colors.border,
//                       },
//                     ]}
//                   />
//                 )}
//               />

//               {/* AUDIO SECTION */}

//               {/* <View style={styles.audioSection}>
//               <TouchableOpacity
//                 disabled={!isFormComplete}
//                 style={[
//                   styles.audioButton,
//                   {
//                     opacity: isFormComplete ? 1 : 0.4,
//                   },
//                 ]}
//               >
//                 <Ionicons name="mic" size={34} color={colors.primary} />
//               </TouchableOpacity>

//               <TouchableOpacity
//                 disabled={!isFormComplete}
//                 style={[
//                   styles.audioButton,
//                   {
//                     opacity: isFormComplete ? 1 : 0.4,
//                   },
//                 ]}
//               >
//                 <Octicons name="upload" size={30} color={colors.text} />
//               </TouchableOpacity>
//             </View> */}
//               {/* <View style={[styles.footerContainer]}>
//                 <View style={styles.footerButtonWrapper}>
//                   <TouchableOpacity
//                     disabled={!isFormComplete}
//                     style={[
//                       styles.footerBtn,
//                       {
//                         backgroundColor: isRecording
//                           ? colors.red
//                           : colors.primary,
//                         opacity: isFormComplete ? 1 : 0.5,
//                       },
//                     ]}
//                     onPress={onRecordPress}
//                     accessibilityLabel={
//                       isRecording ? "Stop recording" : "Start recording"
//                     }
//                   >
//                     <Ionicons
//                       name={isRecording ? "stop" : "mic"}
//                       size={40}
//                       color="#fff"
//                     />
//                   </TouchableOpacity>
//                   <Text style={[styles.footerBtnText, { color: colors.text }]}>
//                     {isRecording ? "Stop" : "Record"}
//                   </Text>
//                 </View>

//                 <View style={styles.footerButtonWrapper}>
//                   <TouchableOpacity
//                     disabled={!isFormComplete}
//                     style={[
//                       styles.footerBtn,
//                       {
//                         backgroundColor: colors.primary,
//                         opacity: isFormComplete ? 1 : 0.5,
//                       },
//                     ]}
//                     onPress={onUploadPress}
//                     accessibilityLabel="Upload file"
//                   >
//                     <Octicons name="upload" size={40} color="#fff" />
//                   </TouchableOpacity>
//                   <Text style={[styles.footerBtnText, { color: colors.text }]}>
//                     Upload
//                   </Text>
//                 </View>
//               </View> */}

//               {(selectedFile || recordUri) && (
//                 <View style={styles.sourceRow}>
//                   <TouchableOpacity
//                     style={[styles.playBtn]}
//                     onPress={playAudio}
//                   >
//                     <Ionicons
//                       name={isPlaying ? "pause" : "play"}
//                       size={24}
//                       color={colors.text}
//                       style={{ marginLeft: !isPlaying ? 2 : 0 }}
//                     />
//                   </TouchableOpacity>
//                   {/* Play / Pause button */}
//                   <View
//                     style={{
//                       flex: 1,
//                       justifyContent: "center",
//                       alignItems: "center",
//                     }}
//                   >
//                     <Text
//                       style={styles.fileNameText}
//                       numberOfLines={1}
//                       ellipsizeMode="middle"
//                     >
//                       {selectedFile ?? recordUri?.split("/").pop()}
//                     </Text>
//                   </View>
//                   <View style={styles.sourceActions}>
//                     <TouchableOpacity
//                       onPress={cancelFile}
//                       style={{
//                         marginRight: 12,
//                         backgroundColor: colors.red,
//                         borderRadius: 50,
//                         width: 28,
//                         height: 28,
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                     >
//                       <Ionicons name="close" size={22} color={colors.bgStart} />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}

//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-around",
//                   gap: 10,
//                   alignItems: "center",
//                   paddingVertical: 10,
//                   marginTop: selectedFile || recordUri ? 70 : 90,
//                   paddingHorizontal: 20,
//                 }}
//               >
//                 <AudioService
//                   setStatus={setStatus}
//                   setShowSnackbar={setShowSnackbar}
//                   setMode={setMode}
//                   setAudioBlob={setAudioBlob}
//                   setFileBlob={setFileBlob}
//                   setSelectedFile={setSelectedFile}
//                   recording={recording}
//                   setRecording={setRecording}
//                   setRecordUri={setRecordUri}
//                   isRecording={isRecording}
//                   setIsRecording={setIsRecording}
//                   sound={sound}
//                   setSound={setSound}
//                 />
//               </View>
//               {/* CREATE */}

//               <TouchableOpacity
//                 onPress={handleSubmit(createAppointment)}
//                 disabled={!isFormComplete || (!audioBlob && !fileBlob)}
//                 style={[
//                   styles.createBtn,
//                   {
//                     backgroundColor: colors.primary,
//                     opacity:
//                       isFormComplete && (audioBlob || fileBlob) ? 1 : 0.5,
//                   },
//                 ]}
//               >
//                 <Text style={styles.createBtnText}>Create Appointment</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </Modal>
//       </View>
//       <Snackbar visible={showSnackbar} message={status} color={colors} />
//     </>
//   );
// }

// const createStyles = (colors: any) =>
//   StyleSheet.create({
//     container: {
//       flex: 1,
//     },

//     header: {
//       paddingVertical: 24,
//       paddingHorizontal: 20,
//     },

//     monthText: {
//       color: "#fff",
//       fontSize: 28,
//       fontWeight: "800",
//     },

//     weekContainer: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       marginTop: 24,
//     },

//     dateCircle: {
//       width: 44,
//       height: 60,
//       borderRadius: 20,
//       alignItems: "center",
//       justifyContent: "center",
//     },

//     dayName: {
//       fontSize: 12,
//       fontWeight: "600",
//     },

//     dayNumber: {
//       fontSize: 18,
//       fontWeight: "800",
//       marginTop: 4,
//     },

//     timeSlotRow: {
//       flexDirection: "row",
//       // minHeight: 84,
//       borderBottomWidth: 1,
//       marginTop: 20,
//     },

//     timeColumn: {
//       width: 90,
//       // paddingTop: 12,
//       alignItems: "center",
//     },

//     timeText: {
//       fontSize: 13,
//       fontWeight: "600",
//     },

//     slotContent: {
//       flex: 1,
//       marginVertical: 8,
//       marginRight: 14,
//       borderRadius: 14,
//       padding: 12,
//       justifyContent: "center",
//     },

//     appointmentTitle: {
//       fontSize: 15,
//       fontWeight: "800",
//       color: "#007AFF",
//     },

//     appointmentSub: {
//       fontSize: 13,
//       marginTop: 4,
//       color: "#3A4A5A",
//     },

//     audioBadge: {
//       flexDirection: "row",
//       alignItems: "center",
//       marginTop: 10,
//     },

//     audioText: {
//       marginLeft: 6,
//       fontSize: 12,
//       color: "#007AFF",
//     },

//     fab: {
//       position: "absolute",
//       bottom: 40,
//       right: 24,
//       width: 62,
//       height: 62,
//       borderRadius: 999,
//       justifyContent: "center",
//       alignItems: "center",
//       elevation: 10,
//     },

//     modalContainer: {
//       flex: 1,
//       paddingTop: 60,
//     },

//     modalHeader: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       paddingHorizontal: 20,
//     },

//     modalTitle: {
//       fontSize: 20,
//       fontWeight: "800",
//     },

//     slotBadge: {
//       marginHorizontal: 20,
//       marginTop: 20,
//       borderRadius: 14,
//       paddingVertical: 10,
//       paddingHorizontal: 16,
//     },

//     slotBadgeText: {
//       color: "#fff",
//       fontWeight: "700",
//     },

//     label: {
//       marginTop: 22,
//       marginBottom: 8,
//       marginHorizontal: 20,
//       fontSize: 14,
//       fontWeight: "700",
//     },

//     input: {
//       marginHorizontal: 20,
//       borderWidth: 1,
//       borderRadius: 16,
//       height: 56,
//       paddingHorizontal: 16,
//     },

//     textArea: {
//       marginHorizontal: 20,
//       borderWidth: 1,
//       borderRadius: 16,
//       padding: 16,
//       minHeight: 120,
//       textAlignVertical: "top",
//     },

//     error: {
//       color: "red",
//       marginTop: 4,
//       marginHorizontal: 20,
//       fontSize: 12,
//     },

//     audioSection: {
//       flexDirection: "row",
//       justifyContent: "center",
//       gap: 30,
//       marginTop: 30,
//     },

//     audioButton: {
//       width: 74,
//       height: 74,
//       borderRadius: 999,
//       backgroundColor: "#EEF3FF",
//       justifyContent: "center",
//       alignItems: "center",
//     },

//     createBtn: {
//       marginHorizontal: 20,
//       marginTop: 30,
//       height: 58,
//       borderRadius: 18,
//       justifyContent: "center",
//       alignItems: "center",
//     },

//     createBtnText: {
//       color: "#fff",
//       fontWeight: "800",
//       fontSize: 16,
//     },

//     footerBtn: {
//       alignItems: "center",
//       justifyContent: "center",
//       width: 70,
//       height: 70,
//       borderRadius: 35,
//       borderColor: colors.muted2,
//       borderWidth: 0,
//       shadowColor: colors.text,
//       shadowOpacity: 0.15,
//       shadowOffset: { width: 0, height: 3 },
//       shadowRadius: 4,
//       elevation: 5,
//       marginTop: 10,
//     },
//     footerContainer: {
//       flexDirection: "row",
//       justifyContent: "space-around",
//       gap: 10,
//       alignItems: "center",
//       paddingVertical: 10,
//       paddingBottom: 10,
//       bottom: 0,
//       marginTop: 10,
//       paddingHorizontal: 20,
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

//     sourceRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       gap: 12,
//       marginLeft: 20,
//       marginVertical: 20,
//       width: "90%",
//     },
//     fileNameText: { fontSize: 15, fontWeight: "400", color: colors.muted1 },
//     sourceActions: {
//       flexDirection: "row",
//       alignItems: "center",
//     },
//     playBtn: {
//       alignItems: "center",
//       justifyContent: "center",
//       width: 35,
//       height: 35,
//       borderRadius: 30,
//       backgroundColor: colors.cardBg,
//       borderColor: colors.muted2,
//       borderWidth: 1,
//     },
//   });
