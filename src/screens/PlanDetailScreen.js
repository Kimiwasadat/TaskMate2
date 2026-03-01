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
import LoadingLogo from "../components/LoadingLogo";

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
    <View className="bg-surface border border-border shadow-sm p-4 rounded-2xl mb-3 flex-row items-center">
      <View className="bg-primary/20 w-10 h-10 rounded-full items-center justify-center mr-4">
        <Text className="text-primary-dark font-bold text-lg">{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-text-primary">{item.title}</Text>
        {item.instruction ? (
          <Text className="text-text-muted mt-1" numberOfLines={2}>
            {item.instruction}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        className="p-3"
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("AddEditStep", {
            planId,
            step: item,
            stepIndex: index,
            currentSteps: plan.steps,
          })
        }
      >
        <Text className="text-primary font-bold text-base">Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="p-2 -ml-2"
        >
          <Text className="text-text-muted font-bold text-base">← Back</Text>
        </TouchableOpacity>
        <Text
          className="text-text-primary font-bold text-xl truncate w-1/2 text-center"
          numberOfLines={1}
        >
          {planTitle || "Plan Details"}
        </Text>
        <View className="w-16" />
      </View>

      {loading && !plan ? (
        <View className="flex-1 items-center mt-10">
          <LoadingLogo />
        </View>
      ) : plan ? (
        <View className="flex-1 px-6 pt-6">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-text-primary mb-2 mt-2">
              {plan.title}
            </Text>
            <Text className="text-text-muted text-base leading-relaxed mt-1">
              {plan.description || "No description provided."}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-4 mt-2">
            <Text className="text-xl font-bold text-text-primary">
              Steps ({plan.steps?.length || 0})
            </Text>
            <TouchableOpacity
              className="bg-primary/20 px-4 py-2 rounded-[14px]"
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("AddEditStep", {
                  planId,
                  currentSteps: plan.steps || [],
                })
              }
            >
              <Text className="text-primary-dark font-bold text-sm">
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
              <View className="py-12 items-center justify-center border-2 border-dashed border-border rounded-3xl mt-4">
                <Text className="text-text-muted text-lg font-bold mb-1">
                  No steps yet
                </Text>
                <Text className="text-text-muted text-center px-8">
                  Add steps to guide your employees through this plan.
                </Text>
              </View>
            )}
          />
        </View>
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-text-muted text-lg">Plan not found.</Text>
        </View>
      )}

      {/* Action Bar at Bottom */}
      {plan && (
        <View className="absolute bottom-0 w-full p-6 bg-background border-t border-border shadow-2xl">
          <TouchableOpacity
            onPress={() => navigation.navigate("AssignPlan")}
            className={`h-[56px] rounded-[14px] items-center justify-center ${plan.steps?.length > 0 ? "bg-primary active:bg-primary-dark" : "bg-surface border border-border"}`}
            activeOpacity={0.8}
            disabled={!plan.steps || plan.steps.length === 0}
          >
            <Text
              className={`font-bold text-lg ${plan.steps?.length > 0 ? "text-white" : "text-text-muted"}`}
            >
              {plan.isPublished ? "Assigned & Live" : "Assign to Employee"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
