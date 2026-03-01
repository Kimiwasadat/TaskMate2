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
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2 border-b border-border">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Text className="text-text-muted font-bold text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            {isEditing ? "Edit Step" : "New Step"}
          </Text>
          <TouchableOpacity
            onPress={handleSaveStep}
            disabled={loading}
            activeOpacity={0.7}
            className="p-2 -mr-2"
          >
            {loading ? (
              <ActivityIndicator color="#14B8B8" />
            ) : (
              <Text
                className={`font-bold text-lg ${title.trim() && instruction.trim() ? "text-primary" : "text-text-muted"}`}
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
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Location / Phase *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Travel to Headquarters"
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Instruction (What to do) *
            </Text>
            <TextInput
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Find the supervisor and deliver the documents."
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary h-24 shadow-sm"
              placeholderTextColor="#5B667A"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="mb-8">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Est. Duration (Minutes)
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="e.g. 15"
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
              keyboardType="number-pad"
            />
          </View>

          <View className="mb-8">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Media Attachment
            </Text>
            {localMediaUri ? (
              <View className="relative rounded-xl overflow-hidden mb-2 border border-border shadow-sm">
                <Image
                  source={{ uri: localMediaUri }}
                  className="w-full h-48 bg-surface/50"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-text-primary/70 p-2 rounded-full"
                  activeOpacity={0.7}
                  onPress={() => setLocalMediaUri(null)}
                >
                  <Text className="text-white font-bold text-xs">✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.7}
                className="bg-primary/5 p-6 rounded-2xl border border-dashed border-primary/30 items-center justify-center shadow-sm"
              >
                <Text className="text-primary-dark font-bold mb-1">
                  + Attach Photo or Video
                </Text>
                <Text className="text-text-muted text-xs">
                  Tap to open gallery
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleDeleteStep}
              disabled={loading}
              activeOpacity={0.8}
              className="mt-4 mb-12 h-[56px] rounded-[14px] bg-danger/10 items-center justify-center border border-danger/20 shadow-sm"
            >
              <Text className="text-danger font-bold text-lg">
                Delete Step
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
