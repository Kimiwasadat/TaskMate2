import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { getPlansByCoach } from "../services/firestoreService";

export default function CoachDashboardScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedPlans = await getPlansByCoach(user.id);
      setPlans(fetchedPlans);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  // run when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [user]),
  );

  const renderPlanCard = ({ item }) => (
    <TouchableOpacity
      className="bg-purple-50 p-6 rounded-2xl mb-4 border border-purple-100"
      onPress={() =>
        navigation.navigate("PlanDetail", {
          planId: item.id,
          planTitle: item.title,
        })
      }
    >
      <Text className="text-xl font-bold text-slate-800 mb-2">
        {item.title}
      </Text>
      <Text className="text-slate-600 mb-4" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="bg-purple-100 px-3 py-1 rounded-full">
          <Text className="text-purple-700 text-xs font-bold">
            {item.steps?.length || 0} Steps
          </Text>
        </View>
        <Text className="text-slate-400 text-xs">
          {item.createdAt
            ? new Date(item.createdAt.toDate()).toLocaleDateString()
            : "Draft"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("SignOut error", error);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-16 pb-6 bg-purple-600 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-purple-200 text-sm font-semibold uppercase tracking-wider">
              Coach Dashboard
            </Text>
            <Text className="text-white text-3xl font-extrabold mt-1">
              Hello, {user?.firstName || user?.username || "Coach"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-purple-700 p-3 rounded-full"
          >
            <Text className="text-white font-bold text-xs">Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6 pt-6 -mt-4">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-slate-800">Your Plans</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="bg-purple-200 px-4 py-2 rounded-full mr-2"
              onPress={() => navigation.navigate("AssignPlan")}
            >
              <Text className="text-purple-800 font-bold">Assign</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-600 px-4 py-2 rounded-full"
              onPress={() => navigation.navigate("CreateEditPlan")}
            >
              <Text className="text-white font-bold">+ New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
        ) : plans.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-slate-400 text-lg mb-2">
              No plans created yet.
            </Text>
            <Text className="text-slate-400 text-center px-8">
              Create your first training plan to assign to employees.
            </Text>
          </View>
        ) : (
          <FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            renderItem={renderPlanCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </View>
  );
}
