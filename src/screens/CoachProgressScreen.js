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

    let statusColor = "bg-slate-100";
    let statusTextColor = "text-slate-600";
    let statusText = "Not Started";

    if (item.status === "completed") {
      statusColor = "bg-green-100";
      statusTextColor = "text-green-800";
      statusText = "Completed";
    } else if (item.status === "in_progress") {
      statusColor = "bg-blue-100";
      statusTextColor = "text-blue-800";
      statusText = "In Progress";
    }

    return (
      <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-slate-200">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
              {employee.username ? `@${employee.username}` : "Unknown Employee"}
            </Text>
            <Text
              className="text-xl font-extrabold text-slate-800"
              numberOfLines={1}
            >
              {plan.title || "Untitled Plan"}
            </Text>
          </View>
          <View className={`${statusColor} px-3 py-1.5 rounded-full`}>
            <Text className={`${statusTextColor} font-bold text-xs`}>
              {statusText}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-slate-100">
          <View>
            <Text className="text-slate-400 text-xs">Assigned</Text>
            <Text className="text-slate-600 font-medium text-sm">
              {item.assignedAt
                ? new Date(item.assignedAt.toDate()).toLocaleDateString()
                : "Just now"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-slate-400 text-xs">Steps</Text>
            <Text className="text-slate-600 font-medium text-sm">
              {plan.steps?.length || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-6 py-6 border-b border-slate-200 bg-white">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 w-10 h-10 bg-slate-100 rounded-full items-center justify-center p-2"
          >
            <Text className="text-slate-600 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-slate-900">
            Progress Tracker
          </Text>
        </View>
        <Text className="text-slate-500">
          Monitor employee progress across all assigned plans.
        </Text>
      </View>

      <View className="flex-1 px-6 pt-6">
        {loading ? (
          <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
        ) : assignments.length === 0 ? (
          <View className="flex-1 justify-center items-center pb-20">
            <Text className="text-slate-400 text-lg mb-2 text-center">
              No assignments found.
            </Text>
            <Text className="text-slate-400 text-center px-8">
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
