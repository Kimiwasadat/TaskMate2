import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { getPlansByCoach, deletePlan, subscribeToTotalUnreadCount } from "../services/firestoreService";
import LoadingLogo from "../components/LoadingLogo";
import DashboardHeader from "../components/DashboardHeader";

export default function CoachDashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPlans();
        setRefreshing(false);
    };

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

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToTotalUnreadCount(user.id, "coach", (count) => {
            setUnreadCount(count);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDeletePlan = (planId) => {
        Alert.alert(
            "Delete Plan",
            "Are you sure you want to delete this plan? This will also unassign it from any messengers.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deletePlan(planId);
                            await loadPlans();
                        } catch (error) {
                            Alert.alert("Error", "Could not delete plan.");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderPlanCard = ({ item }) => (
        <TouchableOpacity
            className="bg-surface p-5 rounded-2xl mb-4 border border-border shadow-sm"
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate("PlanDetail", {
                    planId: item.id,
                    planTitle: item.title,
                })
            }
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-bold text-text-primary flex-1 mr-2">
                    {item.title}
                </Text>
                <TouchableOpacity onPress={() => handleDeletePlan(item.id)} className="p-2 bg-danger/10 rounded-full">
                    <Text className="text-lg">🗑️</Text>
                </TouchableOpacity>
            </View>
            <Text className="text-base text-text-muted mb-4 mt-1" numberOfLines={2}>
                {item.description}
            </Text>

            <View className="flex-row items-center justify-between mt-2">
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                    <Text className="text-primary-dark text-xs font-bold">
                        {item.steps?.length || 0} Steps
                    </Text>
                </View>
                <Text className="text-text-muted font-medium text-xs">
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
        <View className="flex-1 bg-background">
            <View className="pt-12 pb-8 bg-primary rounded-b-3xl">
                <DashboardHeader
                    variant="light"
                    rightContent={
                        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.8} className="bg-primary-dark/50 border border-white/20 px-4 py-2 rounded-full">
                            <Text className="text-white font-bold text-sm">Log Out</Text>
                        </TouchableOpacity>
                    }
                />
                <View className="px-6 mt-4">
                    <Text className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">
                        Coach Dashboard
                    </Text>
                    <Text className="text-white text-3xl font-black" numberOfLines={1}>
                        Hi, {user?.firstName || user?.username || "Coach"}
                    </Text>
                </View>
            </View>

            <View className="flex-1 px-6 pt-6 -mt-2">
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-text-primary mb-3">Your Plans</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <TouchableOpacity
                            className="bg-primary px-3 py-1.5 rounded-full shadow-sm"
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("CreateEditPlan")}
                        >
                            <Text className="text-white font-bold text-sm">+ New</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-primary px-3 py-1.5 rounded-full shadow-sm"
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("CoachProgress")}
                        >
                            <Text className="text-white font-bold text-sm">Progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-primary px-3 py-1.5 rounded-full shadow-sm"
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("AssignPlan")}
                        >
                            <Text className="text-white font-bold text-sm">Assign</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View className="mt-10 items-center justify-center">
                        <LoadingLogo />
                    </View>
                ) : plans.length === 0 ? (
                    <ScrollView 
                        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={["#3B82F6"]} />
                        }
                    >
                        <Text className="text-text-muted font-semibold text-lg mb-2 mt-10">
                            No plans created yet.
                        </Text>
                        <Text className="text-text-muted text-center px-8 text-base">
                            Create your first training plan to assign to employees.
                        </Text>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={plans}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPlanCard}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={["#3B82F6"]} />
                        }
                    />
                )}
            </View>

            {/* Floating Message Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("CoachMessages")}
            >
                <Ionicons name="chatbubbles" size={28} color="white" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#3B82F6",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
