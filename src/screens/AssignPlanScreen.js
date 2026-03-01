import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import {
  getPlansByCoach,
  getAllEmployees,
  createAssignment,
} from "../services/firestoreService";
import LoadingLogo from "../components/LoadingLogo";

export default function AssignPlanScreen({ navigation }) {
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  useEffect(() => {
    const fetchFormData = async () => {
      if (!user) return;
      try {
        // Fetch both lists concurrently for speed
        const [fetchedPlans, fetchedEmployees] = await Promise.all([
          getPlansByCoach(user.id),
          getAllEmployees(),
        ]);

        setPlans(fetchedPlans);
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error("Error fetching form data:", error);
        Alert.alert("Error", "Could not load plans and employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [user]);

  const handleAssignPlan = async () => {
    if (!selectedPlanId || !selectedEmployeeId) {
      Alert.alert(
        "Missing Selection",
        "Please select both a Plan and an Employee.",
      );
      return;
    }

    setAssigning(true);
    try {
      await createAssignment(selectedEmployeeId, selectedPlanId, user.id);
      Alert.alert("Success!", "The Plan has been assigned to the Employee.");
      navigation.goBack(); // Return to dashboard
    } catch (error) {
      console.error("Error assigning plan:", error);
      Alert.alert("Error", "Failed to assign the plan. Please try again.");
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingLogo />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background relative">
      {/* Header */}
      <View className="p-6 pb-2">
        <View className="flex-row items-center mb-4 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="mr-4 w-10 h-10 bg-surface border border-border shadow-sm rounded-full items-center justify-center"
          >
            <Text className="text-text-muted font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary">
            Assign Plan
          </Text>
        </View>
        <Text className="text-text-muted text-base mb-4">
          Select one of your existing plans and an employee to assign it to.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-2">
        {/* 1. SELECT PLAN */}
        <Text className="text-text-primary font-bold text-lg mb-3 mt-4">
          1. Select a Plan
        </Text>
        {plans.length === 0 ? (
          <Text className="text-text-muted italic mb-6">
            You have not created any plans yet.
          </Text>
        ) : (
          <View className="mb-8">
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                activeOpacity={0.7}
                className={`p-4 rounded-xl mb-3 border-2 shadow-sm ${selectedPlanId === plan.id ? "border-primary/50 bg-primary/10" : "border-border bg-surface"}`}
              >
                <Text
                  className={`font-bold text-lg ${selectedPlanId === plan.id ? "text-primary-dark" : "text-text-primary"}`}
                >
                  {plan.title || "Untitled Plan"}
                </Text>
                {plan.description ? (
                  <Text className="text-text-muted mt-1" numberOfLines={1}>
                    {plan.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 2. SELECT EMPLOYEE */}
        <Text className="text-text-primary font-bold text-lg mb-3 mt-4">
          2. Select an Employee
        </Text>
        {employees.length === 0 ? (
          <Text className="text-text-muted italic mb-6">
            No employees found in the system.
          </Text>
        ) : (
          <View className="mb-24">
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                onPress={() => setSelectedEmployeeId(emp.id)}
                activeOpacity={0.7}
                className={`p-4 rounded-xl mb-3 border-2 shadow-sm ${selectedEmployeeId === emp.id ? "border-primary/50 bg-primary/10" : "border-border bg-surface"}`}
              >
                <Text
                  className={`font-bold text-lg ${selectedEmployeeId === emp.id ? "text-primary-dark" : "text-text-primary"}`}
                >
                  {emp.username
                    ? `@${emp.username}`
                    : `Employee ID: ${emp.id.substring(0, 10)}...`}
                </Text>
                <Text className="text-text-muted mt-1 uppercase text-xs font-bold tracking-wider">
                  {emp.role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Assignment Action */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border shadow-2xl">
        <TouchableOpacity
          onPress={handleAssignPlan}
          disabled={assigning || !selectedPlanId || !selectedEmployeeId}
          activeOpacity={0.8}
          className={`w-full h-[56px] rounded-[14px] items-center justify-center ${!selectedPlanId || !selectedEmployeeId
            ? "bg-surface border border-border"
            : "bg-accent active:bg-accent-dark"
            }`}
        >
          {assigning ? (
            <ActivityIndicator color={!selectedPlanId || !selectedEmployeeId ? "#5B667A" : "white"} />
          ) : (
            <Text className={`font-bold text-lg ${!selectedPlanId || !selectedEmployeeId ? "text-text-muted" : "text-white"}`}>
              {!selectedPlanId || !selectedEmployeeId
                ? "Select both fields to assign"
                : "Create Assignment"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
