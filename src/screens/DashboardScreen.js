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
import LoadingLogo from "../components/LoadingLogo";
import DashboardHeader from "../components/DashboardHeader";
export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        console.log("---- FETCHING ASSIGNMENTS FOR USER ID:", user.id);
        try {
          const fetchedTasks = await getAssignmentsForClient(user.id);
          console.log("---- FOUND DB ASSIGNMENTS:", fetchedTasks);
          
          // Sort tasks: put 'completed' tasks at the bottom
          const sortedTasks = (fetchedTasks || []).sort((a, b) => {
            if (a.status === "completed" && b.status !== "completed") return 1;
            if (a.status !== "completed" && b.status === "completed") return -1;
            return 0;
          });
          
          setTasks(sortedTasks);
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
        className="bg-surface p-5 rounded-2xl mb-4 shadow-sm border border-border"
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("TaskGuidance", {
            assignmentId: item.id,
            planId: item.planId,
          })
        }
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-xl font-bold text-text-primary flex-1 mr-2">
            {plan.title || "Untitled Plan"}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${item.status === "completed" ? "bg-accent/20" : "bg-primary/20"}`}
          >
            <Text
              className={`font-semibold text-xs ${item.status === "completed" ? "text-accent-dark" : "text-primary-dark"}`}
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
          <Text className="text-base text-text-muted mb-4 mt-1" numberOfLines={2}>
            {plan.description}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-2">
          <View>
            <Text className="text-text-muted font-medium text-sm">
              Steps: {plan.steps?.length || 0}
            </Text>
          </View>
          <Text className="text-text-muted font-medium text-sm">
            {item.dueDate || "No Due Date"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingLogo />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <DashboardHeader
        rightContent={
          <TouchableOpacity onPress={() => signOut()} activeOpacity={0.7} className="bg-surface border border-border px-4 py-2 rounded-full shadow-sm">
            <Text className="text-primary-dark font-bold text-sm">Sign Out</Text>
          </TouchableOpacity>
        }
      />
      <View className="px-6 flex-1">
        <Text className="text-3xl font-black text-text-primary mb-2 mt-2">
          Hi, {user?.firstName || "Messenger"}!
        </Text>
        <View className="flex-row justify-between items-center mb-8 mt-2">
          <Text className="text-lg font-semibold text-text-muted">
            Here are your tasks for today.
          </Text>
          <TouchableOpacity
            className="bg-surface border border-border px-3 py-1 rounded-lg"
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Debug")}
          >
            <Text className="text-text-primary font-medium text-sm">
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
              <Text className="text-text-muted text-lg text-center">
                No tasks assigned yet.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
