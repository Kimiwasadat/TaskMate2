import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { getAssignmentsForClient } from "../services/firestoreService";
export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        try {
          const fetchedTasks = await getAssignmentsForClient(user.id);
          setTasks(fetchedTasks || []);
        } catch (error) {
          console.error("Error fetching tasks:", error);
          setTasks([]);
        }
      }
      setLoading(false);
    };
    fetchTasks();
  }, [user]);

  // Timer is temporarily removed pending realtime implementation

  const formatTime = (minutes) => {
    if (!minutes) return "--:--";
    const totalSeconds = minutes * 60;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderItem = ({ item }) => {
    const plan = item.planDetails || {};

    return (
      <TouchableOpacity
        className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-slate-200"
        onPress={() =>
          navigation.navigate("TaskGuidance", {
            assignmentId: item.id,
            planId: item.planId,
          })
        }
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-2xl font-bold text-slate-800 flex-1 mr-2">
            {plan.title || "Untitled Plan"}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${item.status === "completed" ? "bg-green-100" : "bg-blue-100"}`}
          >
            <Text
              className={`font-semibold ${item.status === "completed" ? "text-green-800" : "text-blue-800"}`}
            >
              {item.status === "completed"
                ? "Done"
                : item.status === "in_progress"
                  ? "Started"
                  : "To Do"}
            </Text>
          </View>
        </View>

        {plan.description ? (
          <Text className="text-lg text-slate-600 mb-4" numberOfLines={2}>
            {plan.description}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 font-medium">
              Steps: {plan.steps?.length || 0}
            </Text>
          </View>
          <Text className="text-slate-500 font-medium">
            {item.dueDate || "No Due Date"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-6 flex-1">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-4xl font-extrabold text-slate-900">
            Hello, {user?.firstName || "Messenger"}!
          </Text>
          <TouchableOpacity onPress={() => signOut()}>
            <Text className="text-blue-600 font-bold text-lg">Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-xl text-slate-600">
            Here are your tasks for today.
          </Text>
          <TouchableOpacity
            className="bg-slate-200 px-3 py-1 rounded-lg"
            onPress={() => navigation.navigate("Debug")}
          >
            <Text className="text-slate-700 font-medium text-sm">
              Debug Auth
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-slate-400 text-lg">
                No tasks assigned yet.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
