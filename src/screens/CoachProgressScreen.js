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
      <View className="bg-surface p-5 rounded-2xl mb-4 shadow-sm border border-border">
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
      </View>
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
