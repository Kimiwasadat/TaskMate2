import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { useUser } from "@clerk/clerk-expo";
import { generateAndPlayAudio } from "../services/ttsService";
import { getTaskHelp } from "../services/aiService";
import {
  getPlanById,
  updateAssignmentStatus,
  updateAssignmentProgress, // Added
  toggleAssignmentHelp, // Added
  getUserPushToken,
} from "../services/firestoreService";
import { scheduleIdleReminder, cancelReminder, sendPushNotification } from "../services/notificationService";
import LoadingLogo from "../components/LoadingLogo";
import { Video } from "expo-av";

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

  // New AI Helper states
  const [isAIHelperLoading, setIsAIHelperLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);
  const [coachNotified, setCoachNotified] = useState(false);

  // Reminders
  const activeReminderRef = useRef(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const data = await getPlanById(planId);
        if (data) {
          setPlan(data);
        } else {
          console.log("Plan not found");
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanDetails();
  }, [planId]);

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
    }
  }, [plan, currentStepIndex]);

  useEffect(() => {
    if (timeLeft <= 0 && stepTimeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setStepTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, stepTimeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentStep = plan?.steps?.[currentStepIndex];
  const isLastStep = currentStepIndex === (plan?.steps?.length || 0) - 1;

  // Setup idle reminder for each step
  useEffect(() => {
    const setupReminder = async () => {
      if (activeReminderRef.current) {
        await cancelReminder(activeReminderRef.current);
        activeReminderRef.current = null;
      }
      if (plan && currentStep) {
        const id = await scheduleIdleReminder(currentStep.instruction, 30);
        activeReminderRef.current = id;
      }
    };

    setupReminder();

    return () => {
      if (activeReminderRef.current) {
        cancelReminder(activeReminderRef.current);
        activeReminderRef.current = null;
      }
    };
  }, [currentStepIndex, plan]);

  // Listen for the notification to fire, and read it aloud using the natural voice
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      // If the notification TITLE contains our Stay on Track identifier
      if (notification.request.content.title?.includes("Stay on Track")) {
        const textToSpeak = notification.request.content.body;
        
        // Stop any current audio
        if (isSpeaking && currentSound) {
          await currentSound.unloadAsync();
          setCurrentSound(null);
        }
        
        // Generate and play the natural voice
        setIsSpeaking(true);
        try {
          const sound = await generateAndPlayAudio(textToSpeak);
          if (sound) {
            setCurrentSound(sound);
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) {
                setIsSpeaking(false);
                sound.unloadAsync();
                setCurrentSound(null);
              }
            });
          } else {
            setIsSpeaking(false);
          }
        } catch (error) {
          setIsSpeaking(false);
          console.error("Audio generation failed for reminder:", error);
        }
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [currentSound, isSpeaking]);

  const speakText = async () => {
    const textToSpeak = currentStep?.ttsText || currentStep?.instruction;
    if (!textToSpeak) return;

    if (isSpeaking) {
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      try {
        const sound = await generateAndPlayAudio(textToSpeak);
        if (sound) {
          setCurrentSound(sound);
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsSpeaking(false);
              sound.unloadAsync();
              setCurrentSound(null);
            }
          });
        } else {
          setIsSpeaking(false);
        }
      } catch (error) {
        setIsSpeaking(false);
        console.error("Audio generation failed:", error);
      }
    }
  };

  const handleAskAI = async () => {
    // 1. Stop any current audio
    if (isSpeaking) {
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      setIsSpeaking(false);
    }

    // 2. Load the AI tip
    setAiLoading(true);
    setAiResponse(null);

    const helpText = await getTaskHelp(plan.title, currentStep?.instruction);
    setAiResponse(helpText);
    setAiLoading(false);

    // 3. Play the AI tip in a natural voice instantly
    setIsSpeaking(true);
    try {
      const sound = await generateAndPlayAudio(helpText);
      if (sound) {
        setCurrentSound(sound);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsSpeaking(false);
            sound.unloadAsync();
            setCurrentSound(null);
          }
        });
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      setIsSpeaking(false);
      console.error("Audio generation failed for AI help:", error);
    }
  };

  const handleAIHelp = async () => {
    try {
      setIsAIHelperLoading(true);
      // Stop any current audio
      if (isSpeaking) {
        if (currentSound) {
          await currentSound.unloadAsync();
          setCurrentSound(null);
        }
        setIsSpeaking(false);
      }
      setAiMessage(null); // Clear previous AI message
      const helpMsg = await getTaskHelp(plan.title, currentStep.instruction); // Using getTaskHelp from aiService
      setAiMessage(helpMsg);

      // Play the AI tip in a natural voice instantly
      setIsSpeaking(true);
      try {
        const sound = await generateAndPlayAudio(helpMsg);
        if (sound) {
          setCurrentSound(sound);
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsSpeaking(false);
              sound.unloadAsync();
              setCurrentSound(null);
            }
          });
        } else {
          setIsSpeaking(false);
        }
      } catch (error) {
        setIsSpeaking(false);
        console.error("Audio generation failed for AI help:", error);
      }

    } catch (error) {
      console.error(error);
      setAiMessage("Sorry, I could not connect to the AI service right now.");
    } finally {
      setIsAIHelperLoading(false);
    }
  };

  const handleAskCoach = async () => {
    try {
      if (assignmentId) {
        await toggleAssignmentHelp(assignmentId, true);
      }
      // Send a push notification to the coach
      if (plan?.coachId) {
        try {
          const coachToken = await getUserPushToken(plan.coachId);
          if (coachToken) {
            await sendPushNotification(
              coachToken,
              "Employee Needs Help",
              `${user?.firstName || "An employee"} is stuck on step ${currentStepIndex + 1} of "${plan.title}".`
            );
          }
        } catch (pushError) {
          console.error("Failed to send push notification to coach, but DB updated:", pushError);
        }
      }
      setCoachNotified(true);
    } catch (error) {
      console.error("Error setting help status:", error);
      Alert.alert("Error", "Failed to update help status.");
    }
  };

  // Keep assignment progress synced when step changes
  useEffect(() => {
    if (assignmentId) {
      updateAssignmentProgress(assignmentId, currentStepIndex).catch(err => 
        console.error("Failed to update exact step progress in DB", err)
      );
    }
  }, [currentStepIndex, assignmentId]);

  const handleNextStep = async () => {
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
        await toggleAssignmentHelp(assignmentId, false);
      }

      if (isLastStep) {
        // If it's the last step, mark the entire assignment as completed
        await updateAssignmentStatus(assignmentId, "completed");

        // Notify the coach
        try {
          if (plan.coachId) {
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
          await updateAssignmentStatus(assignmentId, "in_progress");
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
        await toggleAssignmentHelp(assignmentId, false);
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
            className="bg-danger/10 px-3 py-1.5 rounded-full"
          >
            <Text className="text-danger font-bold text-sm">Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row: Step Counter and Timers */}
        <View className="flex-row justify-between items-center">
          <Text className="text-text-muted font-medium text-sm">
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
            {stepTimeLeft > 0 && (
              <Text className="text-sm font-bold text-primary">
                ⏱ {formatTime(stepTimeLeft)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Main Content Area - Now Scrollable */}
      <ScrollView 
        className="flex-1 w-full"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Support both the new mediaUrls array, and fallback to legacy mediaUrl string */}
        {(currentStep?.mediaUrls?.length > 0 || currentStep?.mediaUrl) ? (
          <View className="mb-6">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {(currentStep?.mediaUrls || [currentStep.mediaUrl]).map((url, index) => (
                <View key={index} className="w-[315px] h-64 rounded-3xl overflow-hidden bg-surface/50 border border-border shadow-sm mr-4">
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
        ) : (
          <View className="w-full h-40 bg-surface rounded-3xl mb-6 items-center justify-center border border-dashed border-border shadow-sm">
            <Text className="text-text-muted font-medium">
              {currentStep?.title || "Step Instruction"}
            </Text>
          </View>
        )}

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
        <View className="w-full mt-2">
          
          {/* 1. Primary Action: Finish Task / Next Step */}
          <View className="flex-row gap-4 mb-6">
            {currentStepIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevStep}
                activeOpacity={0.7}
                className="flex-1 bg-surface border border-border rounded-2xl items-center justify-center h-[60px] shadow-sm"
              >
                <Text className="text-text-primary font-bold text-lg">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNextStep}
              activeOpacity={0.8}
              className={`flex-[2] rounded-2xl items-center justify-center h-[60px] shadow-md ${isLastStep ? "bg-accent active:bg-accent-dark" : "bg-primary active:bg-primary-dark"}`}
            >
              <Text className="text-white font-extrabold text-xl tracking-wider uppercase">
                {isLastStep ? "Finish Task" : "Next Step"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Accessibility / AI Help Row */}
          <View className="flex-row justify-between mb-6 gap-4">
            <TouchableOpacity
              onPress={speakText}
              activeOpacity={0.7}
              className={`flex-1 flex-row justify-center items-center py-4 rounded-xl shadow-sm ${isSpeaking && !aiResponse && !aiMessage ? "bg-primary/20 border border-primary/40" : "bg-surface border border-border"}`}
            >
              <Text className="text-2xl mr-2">
                {isSpeaking && !aiResponse && !aiMessage ? "🔊" : "🔈"}
              </Text>
              <Text
                className={`text-lg font-bold ${isSpeaking && !aiResponse && !aiMessage ? "text-primary-dark" : "text-text-primary"}`}
              >
                Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row justify-center items-center py-4 rounded-xl border shadow-sm bg-primary/10 border-primary/30"
              onPress={handleAIHelp}
              disabled={isAIHelperLoading}
              activeOpacity={0.7}
            >
              {isAIHelperLoading ? (
                <ActivityIndicator color="#14B8B8" size="small" />
              ) : (
                <>
                  <Text className="text-xl mr-2">✨</Text>
                  <Text className="text-primary-dark text-lg font-bold">
                    AI Help
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Ask Coach Button */}
          <TouchableOpacity
            className="w-full bg-danger/10 py-4 rounded-xl items-center border border-danger/30 shadow-sm flex-row justify-center"
            onPress={handleAskCoach}
          >
            <Text className="text-xl mr-2">🙋🏽‍♂️</Text>
            <Text className="text-danger-dark font-bold text-lg">
              Ask Coach
            </Text>
          </TouchableOpacity>

          {/* Coach Notified Banner */}
          {coachNotified && (
            <View className="w-full bg-accent/10 border border-accent/30 rounded-xl p-4 mt-4 flex-row items-center">
              <Text className="text-xl mr-3">✅</Text>
              <View className="flex-1">
                <Text className="text-accent-dark font-bold text-base mb-1">
                  Coach Notified
                </Text>
                <Text className="text-accent-dark/80 text-sm font-medium">
                  Your coach has been alerted and will reach out to help you shortly.
                </Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
