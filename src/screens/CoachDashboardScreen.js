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
import LoadingLogo from "../components/LoadingLogo";
import DashboardHeader from "../components/DashboardHeader";

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
            className="bg-surface p-5 rounded-2xl mb-4 border border-border shadow-sm"
            activeOpacity={0.7}
            onPress={() =>
                navigation.navigate("PlanDetail", {
                    planId: item.id,
                    planTitle: item.title,
                })
            }
        >
            <Text className="text-xl font-bold text-text-primary mb-2">
                {item.title}
            </Text>
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
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-text-primary">Your Plans</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            className="bg-surface border border-border px-4 py-2 rounded-full mr-2"
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("CoachProgress")}
                        >
                            <Text className="text-text-primary font-bold text-sm">Progress</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-primary/20 px-4 py-2 rounded-full mr-2"
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("AssignPlan")}
                        >
                            <Text className="text-primary-dark font-bold text-sm">Assign</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-primary px-4 py-2 rounded-full"
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate("CreateEditPlan")}
                        >
                            <Text className="text-white font-bold text-sm">+ New</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <View className="mt-10 items-center justify-center">
                        <LoadingLogo />
                    </View>
                ) : plans.length === 0 ? (
                    <View className="flex-1 justify-center items-center mt-20">
                        <Text className="text-text-muted font-semibold text-lg mb-2">
                            No plans created yet.
                        </Text>
                        <Text className="text-text-muted text-center px-8 text-base">
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
