import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updatePlanSteps } from "../services/firestoreService";

export default function AddEditStepScreen({ route, navigation }) {
  // Determine if we are adding a new step, or editing an existing one
  const { planId, step, stepIndex, currentSteps } = route.params;
  const isEditing = step !== undefined;

  const [title, setTitle] = useState(step?.title || "");
  const [instruction, setInstruction] = useState(step?.instruction || "");
  const [durationMinutes, setDurationMinutes] = useState(
    step?.durationMinutes?.toString() || "",
  );
  const [loading, setLoading] = useState(false);

  const handleSaveStep = async () => {
    if (!title.trim() || !instruction.trim()) {
      Alert.alert(
        "Missing Information",
        "Please provide a title and instruction for this step.",
      );
      return;
    }

    setLoading(true);
    try {
      const newStep = {
        id: isEditing ? step.id : Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        instruction: instruction.trim(),
        durationMinutes: parseInt(durationMinutes) || 0,
        isCompleted: false, // Default for assignments later
        // Future fields for Media Uploads will go here
      };

      const updatedSteps = [...currentSteps];

      if (isEditing) {
        updatedSteps[stepIndex] = newStep;
      } else {
        updatedSteps.push(newStep);
      }

      await updatePlanSteps(planId, updatedSteps);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving step:", error);
      Alert.alert("Error", "Could not save the step. Please try again.");
      setLoading(false);
    }
  };

  const handleDeleteStep = async () => {
    Alert.alert(
      "Delete Step",
      "Are you sure you want to remove this step from the plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const updatedSteps = currentSteps.filter(
                (_, idx) => idx !== stepIndex,
              );
              await updatePlanSteps(planId, updatedSteps);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting step:", error);
              Alert.alert("Error", "Could not delete the step.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Text className="text-purple-600 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-slate-800 font-extrabold text-xl">
            {isEditing ? "Edit Step" : "New Step"}
          </Text>
          <TouchableOpacity
            onPress={handleSaveStep}
            disabled={loading}
            className="p-2 -mr-2"
          >
            {loading ? (
              <ActivityIndicator color="#9333ea" />
            ) : (
              <Text
                className={`font-bold text-lg ${title.trim() && instruction.trim() ? "text-purple-600" : "text-slate-400"}`}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider mb-2">
              Location / Phase *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Travel to Headquarters"
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg font-semibold text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="mb-6">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider mb-2">
              Instruction (What to do) *
            </Text>
            <TextInput
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Find the supervisor and deliver the documents."
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-base text-slate-800 h-24"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="mb-8">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider mb-2">
              Est. Duration (Minutes)
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="e.g. 15"
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg text-slate-800"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>

          <View className="mb-8 bg-purple-50 p-5 rounded-2xl border border-dashed border-purple-200">
            <Text className="text-center text-purple-800 font-semibold mb-1 mt-2">
              Media Uploads Coming Soon
            </Text>
            <Text className="text-center text-purple-600 text-sm mb-2 px-4">
              You will soon be able to attach photos and videos to this step to
              guide your employees.
            </Text>
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleDeleteStep}
              disabled={loading}
              className="mt-4 mb-12 py-4 rounded-xl bg-red-50 items-center justify-center border border-red-200"
            >
              <Text className="text-red-600 font-bold text-lg">
                Delete Step
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
