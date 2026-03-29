import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { getAssignmentsForClient } from "../services/firestoreService";
import LoadingLogo from "../components/LoadingLogo";
import DashboardHeader from "../components/DashboardHeader";
import { NetworkContext } from "../context/NetworkContext";
import NetworkStatusBanner from "../components/NetworkStatusBanner";
import { saveOfflineAssignments, getOfflineAssignments } from "../services/offlineStorageService";

export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useContext(NetworkContext);

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        console.log("---- FETCHING ASSIGNMENTS FOR USER ID:", user.id);
        try {
          if (isOffline) {
            console.log("Offline: Loading assignments from local storage");
            const cachedTasks = await getOfflineAssignments();
            setTasks(cachedTasks || []);
          } else {
            console.log("Online: Fetching from DB");
            const fetchedTasks = await getAssignmentsForClient(user.id);
            setTasks(fetchedTasks || []);
            await saveOfflineAssignments(fetchedTasks || []);
          }
        } catch (error) {
          console.error("Error fetching tasks:", error);
          if (!isOffline) {
            // Fallback
            const cachedTasks = await getOfflineAssignments();
            setTasks(cachedTasks || []);
          } else {
            setTasks([]);
          }
        }
      }
      setLoading(false);
    };
    fetchTasks();
  }, [user, isOffline]);

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
    const isCompleted = item.status === "completed";

    return (
      <TouchableOpacity
        className={`bg-surface p-5 rounded-2xl mb-4 shadow-sm border ${isCompleted ? 'border-border/50 opacity-80' : 'border-border border-l-4 border-l-primary'}`}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("TaskGuidance", {
            assignmentId: item.id,
            planId: item.planId,
          })
        }
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text 
            className={`text-xl font-bold flex-1 mr-2 ${isCompleted ? 'text-text-primary/70 line-through' : 'text-text-primary'}`}
          >
            {plan.title || "Untitled Plan"}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${isCompleted ? "bg-accent/20" : "bg-primary/20"}`}
          >
            <Text
              className={`font-semibold text-xs ${isCompleted ? "text-accent-dark" : "text-primary-dark"}`}
            >
              {isCompleted
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

  const renderSectionHeader = ({ section: { title } }) => (
    <View className="bg-background/95 py-3 mb-2 mt-4 backdrop-blur-md">
      <Text className="text-lg font-bold text-text-primary">{title}</Text>
    </View>
  );

  // Group tasks into active and completed sections
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");
  
  const sections = [
    { title: "To Do & Started", data: activeTasks },
    ...(completedTasks.length > 0 ? [{ title: "Done", data: completedTasks }] : [])
  ].filter(section => section.data.length > 0);

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
      <NetworkStatusBanner />
      <View className="px-6 flex-1">
        <Text className="text-3xl font-black text-text-primary mb-2 mt-2">
          Hi, {user?.firstName || "Messenger"}!
        </Text>
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text className="text-lg font-semibold text-text-muted flex-1">
            Here are your tasks for today.
          </Text>
        </View>

        {sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <View className="items-center justify-center py-20 flex-1">
            <Text className="text-4xl mb-4">📭</Text>
            <Text className="text-text-primary text-xl font-bold mb-2">You're all caught up!</Text>
            <Text className="text-text-muted text-center max-w-[250px]">
              No tasks are currently assigned to you. Enjoy your day!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
