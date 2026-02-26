import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getPlanById } from "../services/firestoreService";

export default function PlanDetailScreen({ route, navigation }) {
  const { planId, planTitle } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlanDetails = async () => {
    setLoading(true);
    try {
      const fetchedPlan = await getPlanById(planId);
      setPlan(fetchedPlan);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load plan details.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlanDetails();
    }, [planId]),
  );

  const renderStepCard = ({ item, index }) => (
    <View className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-3 flex-row items-center">
      <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center mr-4">
        <Text className="text-purple-800 font-bold text-lg">{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
        {item.instruction ? (
          <Text className="text-slate-600 mt-1" numberOfLines={2}>
            {item.instruction}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        className="p-3"
        onPress={() =>
          navigation.navigate("AddEditStep", {
            planId,
            step: item,
            stepIndex: index,
            currentSteps: plan.steps,
          })
        }
      >
        <Text className="text-blue-600 font-bold">Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-slate-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <Text className="text-purple-600 font-bold text-lg">← Back</Text>
        </TouchableOpacity>
        <Text
          className="text-slate-800 font-extrabold text-xl truncate w-1/2 text-center"
          numberOfLines={1}
        >
          {planTitle || "Plan Details"}
        </Text>
        <View className="w-16" />
      </View>

      {loading && !plan ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : plan ? (
        <View className="flex-1 px-6 pt-6">
          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-slate-900 mb-2">
              {plan.title}
            </Text>
            <Text className="text-slate-600 text-base leading-relaxed">
              {plan.description || "No description provided."}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-4 mt-2">
            <Text className="text-xl font-bold text-slate-800">
              Steps ({plan.steps?.length || 0})
            </Text>
            <TouchableOpacity
              className="bg-purple-100 px-4 py-2 rounded-full"
              onPress={() =>
                navigation.navigate("AddEditStep", {
                  planId,
                  currentSteps: plan.steps || [],
                })
              }
            >
              <Text className="text-purple-700 font-bold text-sm">
                + Add Step
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={plan.steps || []}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderStepCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="py-12 items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl mt-4">
                <Text className="text-slate-400 text-lg font-bold mb-1">
                  No steps yet
                </Text>
                <Text className="text-slate-400 text-center px-8">
                  Add steps to guide your employees through this plan.
                </Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-slate-500 text-lg">Plan not found.</Text>
        </View>
      )}

      {/* Action Bar at Bottom */}
      {plan && (
        <View className="absolute bottom-0 w-full p-6 bg-white border-t border-slate-100 shadow-xl">
          <TouchableOpacity
            onPress={() => navigation.navigate("AssignPlan")}
            className={`py-4 rounded-full items-center justify-center ${plan.steps?.length > 0 ? "bg-purple-600" : "bg-slate-300"}`}
            disabled={!plan.steps || plan.steps.length === 0}
          >
            <Text
              className={`font-extrabold text-lg ${plan.steps?.length > 0 ? "text-white" : "text-slate-500"}`}
            >
              {plan.isPublished ? "Assigned & Live" : "Assign to Employee"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
