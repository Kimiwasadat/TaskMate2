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
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { getAssignmentsByCoach } from "../services/firestoreService";
import LoadingLogo from "../components/LoadingLogo";

export default function CoachProgressScreen({ navigation }) {
  const { user } = useUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadProgress = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedAssignments = await getAssignmentsByCoach(user.id);
      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error loading progress:", error);
      Alert.alert("Error", "Could not load assignment progress.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [user]),
  );

  const renderAssignmentCard = ({ item }) => {
    const plan = item.planDetails || {};
    const employee = item.userDetails || {};
    const isExpanded = expandedCards[item.id] || false;
    const currentStepIdx = item.currentStepIndex || 0;
    const needsHelp = item.needsHelp || false;

    let statusColor = "bg-surface border border-border";
    let statusTextColor = "text-text-muted";
    let statusText = "Not Started";

    if (item.status === "completed") {
      statusColor = "bg-accent/20 border border-accent/30";
      statusTextColor = "text-accent-dark";
      statusText = "Completed";
    } else if (item.status === "in_progress") {
      statusColor = "bg-primary/20 border border-primary/30";
      statusTextColor = "text-primary-dark";
      statusText = "In Progress";
    }

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => toggleCardExpansion(item.id)}
        className={`bg-surface p-5 rounded-2xl mb-4 shadow-sm border ${needsHelp ? "border-danger border-2" : "border-border"}`}
      >
        {needsHelp && (
          <View className="bg-danger absolute -top-3 -right-2 px-3 py-1 rounded-full shadow-md z-10 flex-row items-center justify-center">
            <Text className="text-white text-xs font-bold mr-1">⚠️</Text>
            <Text className="text-white text-xs font-bold uppercase tracking-wider">Needs Help</Text>
          </View>
        )}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
              {employee.username ? `@${employee.username}` : "Unknown Employee"}
            </Text>
            <Text
              className="text-xl font-bold text-text-primary mt-1"
              numberOfLines={1}
            >
              {plan.title || "Untitled Plan"}
            </Text>
          </View>
          <View className={`${statusColor} px-3 py-1.5 rounded-[14px]`}>
            <Text className={`${statusTextColor} font-bold text-xs`}>
              {statusText}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-border mt-1">
          <View>
            <Text className="text-text-muted text-xs">Assigned</Text>
            <Text className="text-text-primary font-bold text-sm">
              {item.assignedAt
                ? new Date(item.assignedAt.toDate()).toLocaleDateString()
                : "Just now"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-text-muted text-xs">Steps</Text>
            <Text className="text-text-primary font-bold text-sm">
              {plan.steps?.length || 0}
            </Text>
          </View>
        </View>

        {isExpanded && plan.steps && plan.steps.length > 0 && (
          <View className="mt-4 pt-4 border-t border-border border-dashed">
            <Text className="text-text-primary font-bold mb-3">Plan Progress</Text>
            {plan.steps.map((step, index) => {
              let icon = <View className="w-5 h-5 rounded-full border-2 border-border mr-3" />; // Future step
              let nameColor = "text-text-muted";
              
              if (item.status === "completed" || index < currentStepIdx) {
                // Completed Step
                icon = (
                  <View className="w-5 h-5 rounded-full bg-accent items-center justify-center mr-3">
                    <Text className="text-white text-[10px] font-bold">✓</Text>
                  </View>
                );
                nameColor = "text-text-primary line-through opacity-60";
              } else if (index === currentStepIdx && item.status !== "completed") {
                // Active Step
                if (needsHelp) {
                  icon = (
                    <View className="w-5 h-5 mr-3 items-center justify-center bg-danger rounded-full shadow-sm">
                      <Text className="text-white text-[10px] font-bold">!</Text>
                    </View>
                  );
                  nameColor = "text-danger-dark font-bold";
                } else {
                  icon = (
                    <View className="w-5 h-5 mr-3 items-center justify-center">
                      <ActivityIndicator size="small" color="#14B8B8" />
                    </View>
                  );
                  nameColor = "text-primary-dark font-bold";
                }
              }

              return (
                <View key={index} className="flex-row items-center mb-3 pr-4">
                  {icon}
                  <View className="flex-1">
                    <Text className={`${nameColor} text-sm`} numberOfLines={2}>
                      {index + 1}. {step.title}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-6 border-b border-border bg-surface">
        <View className="flex-row items-center mb-2 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="mr-3 w-10 h-10 bg-background border border-border shadow-sm rounded-full items-center justify-center"
          >
            <Text className="text-text-muted font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary">
            Progress Tracker
          </Text>
        </View>
        <Text className="text-text-muted">
          Monitor employee progress across all assigned plans.
        </Text>
      </View>

      <View className="flex-1 px-6 pt-6">
        {loading ? (
          <View className="mt-10 items-center justify-center">
            <LoadingLogo />
          </View>
        ) : assignments.length === 0 ? (
          <View className="flex-1 justify-center items-center pb-20">
            <Text className="text-text-muted font-medium text-lg mb-2 text-center">
              No assignments found.
            </Text>
            <Text className="text-text-muted text-center px-8">
              When you assign plans to employees, they will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssignmentCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
