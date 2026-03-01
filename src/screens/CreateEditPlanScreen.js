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
import { useUser } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { createPlan } from "../services/firestoreService";

export default function CreateEditPlanScreen({ navigation }) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSavePlan = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Information", "Please enter a plan title.");
      return;
    }

    setLoading(true);
    try {
      const planData = {
        title: title.trim(),
        description: description.trim(),
        steps: [], // Start with empty steps
        isPublished: false,
      };

      const newPlanId = await createPlan(user.id, planData);

      // Navigate to the detail screen to start adding steps immediately
      navigation.replace("PlanDetail", {
        planId: newPlanId,
        planTitle: planData.title,
      });
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert("Error", "Could not save the plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Text className="text-text-muted font-bold text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            New Plan
          </Text>
          <TouchableOpacity
            onPress={handleSavePlan}
            disabled={loading}
            activeOpacity={0.7}
            className="p-2 -mr-2"
          >
            {loading ? (
              <ActivityIndicator color="#14B8B8" />
            ) : (
              <Text
                className={`font-bold text-lg ${title.trim() ? "text-primary" : "text-text-muted"}`}
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
              Plan Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning Route Delivery"
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
              autoFocus
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-bold text-sm mb-2">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Briefly describe the goal or context of this plan..."
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary h-32 shadow-sm"
              placeholderTextColor="#5B667A"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
