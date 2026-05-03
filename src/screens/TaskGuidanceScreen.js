import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { useUser } from "@clerk/clerk-expo";
import { generateAndPlayAudio } from "../services/ttsService";
import { getTaskHelp, getTaskHelpWithAudio, getProactiveSocialScript } from "../services/aiService";
import {
  getPlanById,
  getAssignmentById,
  updateAssignmentStatus,
  updateAssignmentProgress, // Added
  toggleAssignmentHelp, // Added
  getUserPushToken,
} from "../services/firestoreService";
import { scheduleIdleReminder, cancelReminder, scheduleRepeatingReminder, sendPushNotification, cancelAllReminders, scheduleTimeUpNotification } from "../services/notificationService";
import LoadingLogo from "../components/LoadingLogo";
import { Video, Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { NetworkContext } from "../context/NetworkContext";
import NetworkStatusBanner from "../components/NetworkStatusBanner";
import { queueOfflineAction, updateOfflineAssignment, getOfflineAssignments } from "../services/offlineStorageService";

const isVideo = (url) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".mov") || cleanUrl.endsWith(".m4v");
};

export default function TaskGuidanceScreen({ route, navigation }) {
  const { user } = useUser();
  const { assignmentId, planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);

  // AI UI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // AI Helper states
  const [isAIHelperLoading, setIsAIHelperLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [coachNotified, setCoachNotified] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const recordingTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    global.isAppSpeaking = isSpeaking;
  }, [isSpeaking]);

  // Reminders
  const activeReminderRef = useRef(null);
  const overtimeReminderRef = useRef(null);
  const [isOvertime, setIsOvertime] = useState(false);

  // Audio Queue
  const audioQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);

  // Timer Animation
  const timerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cancelAllReminders();
    };
  }, []);

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim;
    if (stepTimeLeft > 0 && stepTimeLeft <= 5 && Number(currentStep?.durationMinutes) > 0) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(250),
          Animated.timing(blinkAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.delay(250)
        ])
      );
      anim.start();
    } else {
      blinkAnim.setValue(1);
    }
    return () => { if (anim) anim.stop(); };
  }, [stepTimeLeft, currentStep]);

  const colorClass = (stepTimeLeft <= 10 && Number(currentStep?.durationMinutes) > 0)
    ? "text-danger" // Solid Red
    : (stepTimeLeft <= 20 && Number(currentStep?.durationMinutes) > 0) 
      ? "text-yellow-500" // Yellow
      : "text-blue-500"; // Blue

  const processAudioQueue = async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0 || !isMounted.current) return;
    
    isProcessingQueueRef.current = true;
    setIsSpeaking(true);
    
    const item = audioQueueRef.current.shift();
    const textToSpeak = typeof item === 'string' ? item : item.text;
    
    if (item.isReminder) {
      Notifications.scheduleNotificationAsync({
         content: {
           title: item.title,
           body: textToSpeak,
           sound: true,
           data: { isRescheduled: true }
         },
         trigger: null
      }).catch(console.error);
    }

    try {
      const sound = await generateAndPlayAudio(textToSpeak);
      if (sound && isMounted.current) {
        setCurrentSound(sound);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            if (isMounted.current) {
              sound.unloadAsync().catch(() => {});
              setCurrentSound(null);
              setIsSpeaking(false);
              isProcessingQueueRef.current = false;
              if (audioQueueRef.current.length > 0) {
                setTimeout(() => { if (isMounted.current) processAudioQueue(); }, 200);
              }
            }
          }
        });
      } else {
        if (isMounted.current) setIsSpeaking(false);
        if (sound) sound.unloadAsync().catch(() => {});
        isProcessingQueueRef.current = false;
        processAudioQueue();
      }
    } catch (error) {
      if (isMounted.current) setIsSpeaking(false);
      console.error("Audio generation failed:", error);
      isProcessingQueueRef.current = false;
      processAudioQueue();
    }
  };

  const enqueueAudio = (textToSpeak) => {
    audioQueueRef.current.push(textToSpeak);
    if (!isProcessingQueueRef.current) {
      processAudioQueue();
    }
  };

  const { isOffline } = useContext(NetworkContext);
  const { height } = useWindowDimensions();

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        if (isOffline) {
          const cachedTasks = await getOfflineAssignments();
          const cachedTask = cachedTasks.find(t => t.id === assignmentId);
          if (cachedTask && cachedTask.planDetails) {
            setPlan(cachedTask.planDetails);
            if (cachedTask.currentStepIndex) {
              setCurrentStepIndex(cachedTask.currentStepIndex);
            }
          }
        } else {
          const data = await getPlanById(planId);
          if (data) {
            setPlan(data);
            const assignmentData = await getAssignmentById(assignmentId);
            if (assignmentData && assignmentData.currentStepIndex) {
              setCurrentStepIndex(assignmentData.currentStepIndex);
            }
          } else {
            console.log("Plan not found");
          }
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId, assignmentId, isOffline]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  // Handle initial step time when task/step index loads
  useEffect(() => {
    if (plan?.steps?.[currentStepIndex]?.durationMinutes) {
      setStepTimeLeft(plan.steps[currentStepIndex].durationMinutes * 60);
    } else {
      setStepTimeLeft(0);
    }
  }, [plan, currentStepIndex]);

  useEffect(() => {
    if (timeLeft <= 0 && stepTimeLeft <= 0 && !(Number(currentStep?.durationMinutes) > 0)) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setStepTimeLeft((prev) => {
        if (prev === 1 && Number(currentStep?.durationMinutes) > 0) {
          scheduleTimeUpNotification(currentStep.instruction || "Task");
        }
        if (prev <= 1 && Number(currentStep?.durationMinutes) > 0 && !isOvertime) {
          setIsOvertime(true);
          scheduleRepeatingReminder(currentStep.instruction || "Task", 60).then(id => {
            overtimeReminderRef.current = id;
          });
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, stepTimeLeft, currentStep, isOvertime]);

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentStep = plan?.steps?.[currentStepIndex];
  const isLastStep = currentStepIndex === (plan?.steps?.length || 0) - 1;

  const stepMediaUrls = currentStep?.mediaUrls?.length > 0 
    ? currentStep.mediaUrls 
    : (currentStep?.mediaUrl ? [currentStep.mediaUrl] : []);
  const hasMedia = stepMediaUrls.length > 0;

  // Auto-play Social Cue if attached to this step
  useEffect(() => {
    let active = true; // Use this to prevent race conditions if they skip steps fast
    const handleProactiveCue = async () => {
      if (!plan || !currentStep?.socialCue) return;
      
      // Give the UI a tiny moment to render before talking
      setTimeout(async () => {
        if (!active || !isMounted.current) return;
        
        // Stop any current audio
        if (currentSound) {
          try {
            await currentSound.unloadAsync();
          } catch (e) {
            console.log("Audio cleanup failed safely");
          }
          if (isMounted.current) setCurrentSound(null);
        }

        const script = await getProactiveSocialScript(plan, currentStepIndex);
        if (script && active && isMounted.current) {
          enqueueAudio(script);
        }
      }, 500);
    };

    handleProactiveCue();

    return () => {
      active = false;
    };
  }, [plan, currentStepIndex]);

  // Setup idle reminder for each step
  useEffect(() => {
    const setupReminder = async () => {
      if (activeReminderRef.current) {
        await cancelReminder(activeReminderRef.current);
        activeReminderRef.current = null;
      }
      if (overtimeReminderRef.current) {
        await cancelReminder(overtimeReminderRef.current);
        overtimeReminderRef.current = null;
      }
      setIsOvertime(false);
      
      if (plan && currentStep) {
        const durationMins = currentStep.durationMinutes;
        
        // Only schedule a reminder if a timer is set for the step
        if (durationMins && durationMins > 0) {
          // Calculate 4/5 of the time elapsed (e.g. 20 mins -> 16 mins)
          const delaySeconds = Math.floor(durationMins * 60 * 0.8);
          
          if (delaySeconds > 0) {
            const id = await scheduleIdleReminder(currentStep.instruction, delaySeconds);
            activeReminderRef.current = id;
          }
        }
      }
    };

    setupReminder();

    return () => {
      if (activeReminderRef.current) {
        cancelReminder(activeReminderRef.current);
        activeReminderRef.current = null;
      }
      if (overtimeReminderRef.current) {
        cancelReminder(overtimeReminderRef.current);
        overtimeReminderRef.current = null;
      }
    };
  }, [currentStepIndex, plan]);

  // Listen for the notification to fire, and read it aloud using the natural voice
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;
      if (data?.isRescheduled) return;

      const title = notification.request.content.title;
      // If the notification TITLE contains our Stay on Track identifier
      if (title?.includes("Stay on Track") || title?.includes("Overtime Alert!") || title?.includes("Time's Up!")) {
        const textToSpeak = notification.request.content.body;
        // Add the reminder text to the queue to play next without stopping the current one
        enqueueAudio({
          text: textToSpeak,
          title: title,
          isReminder: true
        });
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const speakText = async () => {
    const textToSpeak = currentStep?.ttsText || currentStep?.instruction;
    if (!textToSpeak) return;

    if (isSpeaking || isProcessingQueueRef.current) {
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      setIsSpeaking(false);
      isProcessingQueueRef.current = false;
      audioQueueRef.current = [];
    } else {
      enqueueAudio(textToSpeak);
    }
  };

  const startRecording = async () => {
    try {
      // 0. Stop any currently playing audio so iOS doesn't throw 561017449
      if (isSpeaking || currentSound) {
        if (currentSound) {
          await currentSound.unloadAsync();
          setCurrentSound(null);
        }
        setIsSpeaking(false);
      }

      // 1. Ask permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        console.warn("Microphone permission not granted");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 2. Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setAiMessage(null); // clear old message
      setAiResponse(null); // clear old tip

      // 3. Set a 15-second timeout to stop recording automatically
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording(recording);
      }, 15000);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async (currentRecording = recording) => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (!currentRecording) return;
    setIsRecording(false);
    setIsAIHelperLoading(true);

    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      setRecording(null);

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // Gemini needs standard audio format headers
      const mimeType = "audio/m4a"; 

      // Stop any current visual/audio reading and clear queue
      if (isSpeaking || isProcessingQueueRef.current) {
         if (currentSound) {
           await currentSound.unloadAsync();
           setCurrentSound(null);
         }
         setIsSpeaking(false);
         isProcessingQueueRef.current = false;
         audioQueueRef.current = [];
      }

      // Send to Gemini 2.5 Flash via AI Service
      const helpMsg = await getTaskHelpWithAudio(plan, currentStepIndex, base64Audio, mimeType);
      
      if (!isMounted.current) return;
      setAiMessage(helpMsg);

      // Play the AI tip in a natural voice instantly by enqueueing it
      enqueueAudio(helpMsg);

    } catch (err) {
      console.error("Failed to process recording", err);
      if (isMounted.current) setAiMessage("Sorry, I could not connect to the AI service right now.");
    } finally {
      if (isMounted.current) setIsAIHelperLoading(false);
    }
  };

  const handleAIHelp = () => {
    if (isRecording) {
      stopRecording(recording);
    } else {
      startRecording();
    }
  };

  const handleMessageCoach = () => {
    if (!plan?.coachId) {
      alert("No coach assigned to this plan.");
      return;
    }
    const context = `Task: "${plan.title}"\nStep ${currentStepIndex + 1}: ${currentStep?.instruction || ""}`;
    navigation.navigate("Chat", {
      coachId: plan.coachId,
      clientId: user.id,
      taskContext: context,
    });
  };

  // Keep assignment progress synced when step changes
  useEffect(() => {
    if (loading || !assignmentId) return;
    if (assignmentId) {
      if (isOffline) {
        queueOfflineAction({
          type: 'UPDATE_PROGRESS',
          payload: { assignmentId, currentStepIndex }
        });
        updateOfflineAssignment(assignmentId, { currentStepIndex });
      } else {
        updateAssignmentProgress(assignmentId, currentStepIndex).catch(err => 
          console.error("Failed to update exact step progress in DB", err)
        );
      }
    }
  }, [currentStepIndex, assignmentId, isOffline, loading]);

  const handleNextStep = async () => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
    }
    setIsSpeaking(false);
    isProcessingQueueRef.current = false;
    audioQueueRef.current = [];
    setAiResponse(null);
    setAiMessage(null); // Clear AI Helper message
    setCoachNotified(false); // Clear coach notification banner
    setIsOvertime(false);
    if (overtimeReminderRef.current) {
      cancelReminder(overtimeReminderRef.current);
      overtimeReminderRef.current = null;
    }

    try {
      if (assignmentId) {
        // Assume they figured it out if they had asked for help previously
        if (isOffline) {
          queueOfflineAction({ type: 'TOGGLE_HELP', payload: { assignmentId, needsHelp: false } });
          updateOfflineAssignment(assignmentId, { needsHelp: false });
        } else {
          await toggleAssignmentHelp(assignmentId, false);
        }
      }

      if (isLastStep) {
        // If it's the last step, mark the entire assignment as completed
        if (isOffline) {
          queueOfflineAction({ type: 'UPDATE_STATUS', payload: { assignmentId, status: "completed" } });
          updateOfflineAssignment(assignmentId, { status: "completed" });
        } else {
          await updateAssignmentStatus(assignmentId, "completed");
        }

        // Notify the coach
        try {
          if (plan?.coachId && !isOffline) {
            const coachToken = await getUserPushToken(plan.coachId);
            if (coachToken) {
              const employeeName = user?.firstName || "Your employee";
              await sendPushNotification(
                coachToken, 
                "Task Completed! 🎉", 
                `${employeeName} just finished '${plan.title}'!`
              );
            }
          }
        } catch (notifErr) {
          console.error("Failed to notify coach:", notifErr);
        }

        navigation.replace("TaskComplete");
      } else {
        // If we are just starting the first step, mark assignment as in_progress
        if (currentStepIndex === 0) {
          if (isOffline) {
            queueOfflineAction({ type: 'UPDATE_STATUS', payload: { assignmentId, status: "in_progress" } });
            updateOfflineAssignment(assignmentId, { status: "in_progress" });
          } else {
            await updateAssignmentStatus(assignmentId, "in_progress");
          }
        }
        setCurrentStepIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const handlePrevStep = async () => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
    }
    setIsSpeaking(false);
    setAiResponse(null);
    setAiMessage(null); // Clear AI Helper message
    setCoachNotified(false); // Clear coach notification banner

    try {
      if (assignmentId) {
        // Assume they figured it out if they had asked for help previously
        if (isOffline) {
          queueOfflineAction({ type: 'TOGGLE_HELP', payload: { assignmentId, needsHelp: false } });
          updateOfflineAssignment(assignmentId, { needsHelp: false });
        } else {
          await toggleAssignmentHelp(assignmentId, false);
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingLogo />
      </View>
    );
  }

  if (!plan || !plan.steps || plan.steps.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <View className="bg-surface p-8 rounded-3xl w-full items-center border border-border shadow-sm">
          <Text className="text-4xl mb-4">📭</Text>
          <Text className="text-text-primary text-xl font-bold mb-2 text-center">
            Plan Unavailable
          </Text>
          <Text className="text-text-muted text-center mb-8">
            This plan could not be found or has no steps to complete.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.8}
            className="bg-primary w-full h-[56px] rounded-[14px] items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background flex-col">
      <NetworkStatusBanner />
      {/* Header / Progress */}
      <View className="px-6 py-4 bg-surface border-b border-border">
        {/* Top Row: Title and Exit Button */}
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-text-primary font-bold text-lg flex-1 mr-4" numberOfLines={2}>
            {plan.title}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Exit Task"
            className="bg-danger/10 px-3 py-1.5 rounded-full"
          >
            <Text className="text-danger font-bold text-sm">Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row: Step Counter and Timers */}
        <View className="flex-row justify-between items-center mb-3">
          <Text 
            className="text-text-muted font-bold text-sm uppercase" 
            accessibilityLabel={`Step ${currentStepIndex + 1} of ${plan.steps.length}`}
          >
            Step {currentStepIndex + 1} of {plan.steps.length}
          </Text>
          
          <View className="flex-row items-center">
            {timeLeft > 0 && (
              <Text
                className={`text-sm font-bold ${timeLeft < 300 ? "text-danger" : "text-text-muted"} mr-3`}
              >
                Total: {formatTime(timeLeft)}
              </Text>
            )}
            {currentStep?.durationMinutes > 0 && (
              <Animated.Text style={{ opacity: blinkAnim }} className={`text-sm font-bold ${colorClass}`}>
                ⏱ {formatTime(stepTimeLeft)}
              </Animated.Text>
            )}
          </View>
        </View>

        {/* Accessibility Progress Bar */}
        <View 
          className="w-full h-2.5 bg-border rounded-full overflow-hidden" 
          accessibilityRole="progressbar" 
          accessibilityValue={{ min: 0, max: plan.steps.length, now: currentStepIndex + 1 }}
        >
          <View 
            className="h-full bg-green-500 rounded-full" 
            style={{ width: `${((currentStepIndex + 1) / plan.steps.length) * 100}%` }}
          />
        </View>
      </View>

      {/* Main Content Area - Now Scrollable */}
      <ScrollView 
        className="flex-1 w-full"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Main Content Wrapper - Forces Help Section Below Fold */}
        <View style={{ minHeight: height * 0.60 }} className="justify-center">
          
          <View className="mb-6">
            <View style={{ display: hasMedia ? 'flex' : 'none' }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
              >
                {stepMediaUrls.map((url, index) => (
                  <View key={`${index}-${url}`} className="w-[315px] h-64 rounded-3xl overflow-hidden bg-surface/50 border border-border shadow-sm mr-4">
                    {isVideo(url) ? (
                      <Video
                        source={{ uri: url }}
                        style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                      />
                    ) : (
                      <Image
                        source={{ uri: url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
            
            <View style={{ display: !hasMedia ? 'flex' : 'none' }} className="w-full h-40 bg-surface rounded-3xl items-center justify-center border border-dashed border-border shadow-sm">
              <Text className="text-text-muted font-medium">
                {currentStep?.title || "Step Instruction"}
              </Text>
            </View>
          </View>

        {/* Text Instruction - Large & Clear */}
        <Text className="text-3xl font-bold text-text-primary text-center leading-tight mb-8">
          {currentStep?.instruction}
        </Text>

        {/* AI Response Box (Original) */}
        {aiLoading && (
          <View className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-200 items-center shadow-sm">
            <ActivityIndicator size="small" color="#9333ea" />
            <Text className="text-purple-700 font-bold mt-3 text-lg">
              Thinking of a tip...
            </Text>
          </View>
        )}

        {aiResponse && !aiLoading && (
          <View className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">🤖</Text>
              <Text className="font-bold text-purple-900 text-lg">
                AI Helper
              </Text>
            </View>
            <Text className="text-purple-800 text-xl leading-relaxed font-medium">
              {aiResponse}
            </Text>
          </View>
        )}

        {/* AI Helper Message Box (New) */}
        {aiMessage && !isAIHelperLoading && (
          <View className="mb-6 p-6 bg-primary/10 rounded-2xl border border-primary/30 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">💡</Text>
              <Text className="font-bold text-primary-dark text-lg">
                AI Tip
              </Text>
            </View>
            <Text className="text-primary-dark text-xl leading-relaxed font-medium">
              {aiMessage}
            </Text>
          </View>
        )}

        {/* --- Action Buttons --- */}
        <View className="w-full mt-4">
          
          {/* 1. Primary Action: Finish Task / Next Step */}
          <View className="flex-row gap-4 mb-8">
            {currentStepIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevStep}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back to previous step"
                className="flex-1 bg-surface border border-border rounded-2xl items-center justify-center h-[64px] shadow-sm"
              >
                <Text className="text-text-primary font-bold text-lg">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNextStep}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isLastStep ? "Finish Task" : "Go to next step"}
              className="flex-[3] rounded-2xl items-center justify-center h-[64px] shadow-md bg-green-600 active:bg-green-700 flex-row"
            >
              <Text className="text-white font-extrabold text-xl tracking-wider uppercase mr-2">
                {isLastStep ? "Finish Task" : "Next Step"}
              </Text>
              <Text className="text-white text-xl">{isLastStep ? "✅" : "➡️"}</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>

        <View className="w-full mt-4">
          {/* 2. Help Section (Secondary Actions) */}
          <View className="w-full pt-6 border-t border-border">
            <Text 
              className="text-text-muted font-bold text-sm uppercase tracking-wider mb-4 px-2" 
              accessibilityRole="header"
            >
              Need Assistance?
            </Text>
            
            <View className="flex-col gap-3">
              <TouchableOpacity
                onPress={speakText}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Listen to instruction"
                className={`w-full flex-row items-center py-4 px-5 rounded-xl shadow-sm ${
                  isSpeaking && !aiResponse && !aiMessage
                    ? "bg-cyan-50 border-2 border-cyan-500 shadow-md"
                    : "border border-border bg-surface"
                }`}
              >
                <Text className="text-2xl mr-4">
                  {isSpeaking && !aiResponse && !aiMessage ? "🔊" : "🔈"}
                </Text>
                <Text className={`text-lg font-bold flex-1 ${
                  isSpeaking && !aiResponse && !aiMessage ? "text-cyan-700" : "text-text-primary"
                }`}>
                  Listen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`w-full flex-row items-center py-4 px-5 rounded-xl shadow-sm ${
                  isRecording || isAIHelperLoading || (isSpeaking && (aiResponse || aiMessage))
                    ? "bg-cyan-50 border-2 border-cyan-500 shadow-md" 
                    : "border border-border bg-surface"
                }`}
                onPress={handleAIHelp}
                disabled={isAIHelperLoading}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Get help from AI using voice"
              >
                {isAIHelperLoading ? (
                  <ActivityIndicator color="#0ea5e9" size="small" style={{ marginRight: 16 }} />
                ) : (
                  <Text className="text-2xl mr-4">{isRecording ? "🔴" : "🎙️"}</Text>
                )}
                <Text className={`text-lg font-bold flex-1 ${
                  isRecording || isAIHelperLoading || (isSpeaking && (aiResponse || aiMessage)) 
                    ? "text-cyan-700" 
                    : "text-text-primary"
                }`}>
                  {isRecording ? "Listening... Tap to stop" : "AI Help"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full flex-row items-center py-4 px-5 rounded-xl border border-border bg-surface shadow-sm"
                onPress={handleMessageCoach}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Message your coach for help"
              >
                <Text className="text-2xl mr-4">💬</Text>
                <Text className="text-text-primary font-bold text-lg flex-1">
                  Message Coach
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
