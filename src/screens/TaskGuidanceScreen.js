import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import * as Speech from "expo-speech";
import {
  getPlanById,
  updateAssignmentStatus,
} from "../services/firestoreService";
import LoadingLogo from "../components/LoadingLogo";

export default function TaskGuidanceScreen({ route, navigation }) {
  const { user } = useUser();
  const { assignmentId, planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);

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

    return () => {
      Speech.stop();
    };
  }, [planId]);

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

  const speakText = () => {
    const textToSpeak = currentStep?.ttsText || currentStep?.instruction;
    if (!textToSpeak) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        rate: 0.9,
      });
    }
  };

  const handleNextStep = async () => {
    Speech.stop();
    setIsSpeaking(false);

    try {
      if (isLastStep) {
        // If it's the last step, mark the entire assignment as completed
        await updateAssignmentStatus(assignmentId, "completed");
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

  const handlePrevStep = () => {
    Speech.stop();
    setIsSpeaking(false);
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
          <Text className="text-text-primary text-xl font-bold mb-2 text-center">Plan Unavailable</Text>
          <Text className="text-text-muted text-center mb-8">
            This plan could not be found or has no steps to complete.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.8}
            className="bg-primary w-full h-[56px] rounded-[14px] items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background flex-col">
      {/* Header / Progress */}
      <View className="px-6 py-4 bg-surface border-b border-border flex-row justify-between items-center">
        <View>
          <Text className="text-text-primary font-bold text-lg">{plan.title}</Text>
          <Text className="text-text-muted font-medium text-sm">
            Step {currentStepIndex + 1} of {plan.steps.length}
          </Text>
        </View>
        <View className="flex-row items-center">
          {timeLeft > 0 && (
            <Text
              className={`text-sm font-bold ${timeLeft < 300 ? "text-danger" : "text-text-muted"} mr-4`}
            >
              Total: {formatTime(timeLeft)}
            </Text>
          )}
          {stepTimeLeft > 0 && (
            <Text className="text-sm font-bold text-primary">
              ⏱ This Step: {formatTime(stepTimeLeft)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text className="text-danger font-bold text-base">Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View className="flex-1 px-6 justify-center">
        {currentStep?.mediaUrl ? (
          <View className="w-full h-64 rounded-3xl mb-8 overflow-hidden bg-surface/50 border border-border shadow-sm">
            {/* We will assume it is an image for now, later we can add Video support based on file extension */}
            <Image
              source={{ uri: currentStep.mediaUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="w-full h-40 bg-surface rounded-3xl mb-8 items-center justify-center border border-dashed border-border shadow-sm">
            <Text className="text-text-muted font-medium">
              {currentStep?.title || "Step Instruction"}
            </Text>
          </View>
        )}

        {/* Text Instruction - Large & Clear */}
        <Text className="text-3xl font-bold text-text-primary text-center leading-tight mb-8">
          {currentStep?.instruction}
        </Text>

        {/* Accessibility Toolbar */}
        <View className="flex-row justify-center mb-8">
          <TouchableOpacity
            onPress={speakText}
            activeOpacity={0.7}
            className={`flex-row items-center px-6 py-3 rounded-full ${isSpeaking ? "bg-primary/20" : "bg-surface border border-border"}`}
          >
            <Text className="text-3xl mr-3">{isSpeaking ? "🔊" : "🔈"}</Text>
            <Text
              className={`text-lg font-bold ${isSpeaking ? "text-primary-dark" : "text-text-primary"}`}
            >
              {isSpeaking ? "Stop Reading" : "Read to Me"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls - BIG TARGETS */}
      <View className="px-6 pb-8 pt-4 border-t border-border bg-background">
        <View className="flex-row gap-4">
          {/* Back Button (Small) */}
          {currentStepIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevStep}
              activeOpacity={0.7}
              className="flex-1 bg-surface border border-border rounded-[14px] items-center justify-center h-[56px]"
            >
              <Text className="text-text-primary font-bold text-lg">Back</Text>
            </TouchableOpacity>
          )}

          {/* Next/Done Button (Huge) */}
          <TouchableOpacity
            onPress={handleNextStep}
            activeOpacity={0.8}
            className={`flex-[2] rounded-[14px] items-center justify-center h-[56px] ${isLastStep ? "bg-accent active:bg-accent-dark" : "bg-primary active:bg-primary-dark"}`}
          >
            <Text className="text-white font-bold text-lg">
              {isLastStep ? "FINISH TASK" : "NEXT STEP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
