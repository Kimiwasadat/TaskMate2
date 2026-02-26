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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { updatePlanSteps } from "../services/firestoreService";
import { uploadMediaToStorage } from "../services/storageService";

export default function AddEditStepScreen({ route, navigation }) {
  // Determine if we are adding a new step, or editing an existing one
  const { planId, step, stepIndex, currentSteps } = route.params;
  const isEditing = step !== undefined;

  const [title, setTitle] = useState(step?.title || "");
  const [instruction, setInstruction] = useState(step?.instruction || "");
  const [durationMinutes, setDurationMinutes] = useState(
    step?.durationMinutes?.toString() || "",
  );
  const [localMediaUri, setLocalMediaUri] = useState(step?.mediaUrl || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalMediaUri(result.assets[0].uri);
    }
  };

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
      const stepId = isEditing
        ? step.id
        : Math.random().toString(36).substr(2, 9);
      let finalMediaUrl = step?.mediaUrl || null;

      // If we have a local URI and it's not the same as the existing mediaUrl (meaning they just picked a new file)
      if (localMediaUri && localMediaUri !== step?.mediaUrl) {
        try {
          finalMediaUrl = await uploadMediaToStorage(
            localMediaUri,
            planId,
            stepId,
          );
        } catch (uploadError) {
          Alert.alert(
            "Upload Failed",
            "Failed to upload the image to Firebase Storage.",
          );
          console.error(uploadError);
          finalMediaUrl = null; // Do not block saving the step if image fails, or you could return here
        }
      } else if (!localMediaUri) {
        // If they removed the image
        finalMediaUrl = null;
      }

      const newStep = {
        id: stepId,
        title: title.trim(),
        instruction: instruction.trim(),
        durationMinutes: parseInt(durationMinutes) || 0,
        isCompleted: false,
        mediaUrl: finalMediaUrl,
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

          <View className="mb-8">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider mb-2">
              Media Attachment
            </Text>
            {localMediaUri ? (
              <View className="relative rounded-xl overflow-hidden mb-2 border border-slate-200">
                <Image
                  source={{ uri: localMediaUri }}
                  className="w-full h-48 bg-slate-100"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-slate-900/70 p-2 rounded-full"
                  onPress={() => setLocalMediaUri(null)}
                >
                  <Text className="text-white font-bold text-xs">✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="bg-purple-50 p-6 rounded-2xl border border-dashed border-purple-200 items-center justify-center"
              >
                <Text className="text-purple-600 font-bold mb-1">
                  + Attach Photo or Video
                </Text>
                <Text className="text-purple-400 text-xs">
                  Tap to open gallery
                </Text>
              </TouchableOpacity>
            )}
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
