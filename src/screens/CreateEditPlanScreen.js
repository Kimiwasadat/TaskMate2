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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 -ml-2"
          >
            <Text className="text-purple-600 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-slate-800 font-extrabold text-xl">
            New Plan
          </Text>
          <TouchableOpacity
            onPress={handleSavePlan}
            disabled={loading}
            className="p-2 -mr-2"
          >
            {loading ? (
              <ActivityIndicator color="#9333ea" />
            ) : (
              <Text
                className={`font-bold text-lg ${title.trim() ? "text-purple-600" : "text-slate-400"}`}
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
              Plan Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning Route Delivery"
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg font-semibold text-slate-800"
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>

          <View className="mb-6">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider mb-2">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Briefly describe the goal or context of this plan..."
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-base text-slate-800 h-32"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
