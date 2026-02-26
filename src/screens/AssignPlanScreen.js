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
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative">
      {/* Header */}
      <View className="p-6 pb-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4 w-10 h-10 bg-slate-200 rounded-full items-center justify-center"
          >
            <Text className="text-slate-600 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-slate-900">
            Assign Plan
          </Text>
        </View>
        <Text className="text-slate-500 text-lg mb-4">
          Select one of your existing plans and an employee to assign it to.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-2">
        {/* 1. SELECT PLAN */}
        <Text className="text-slate-800 font-bold text-lg mb-3">
          1. Select a Plan
        </Text>
        {plans.length === 0 ? (
          <Text className="text-slate-500 italic mb-6">
            You have not created any plans yet.
          </Text>
        ) : (
          <View className="mb-8">
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-xl mb-3 border-2 ${selectedPlanId === plan.id ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white"}`}
              >
                <Text
                  className={`font-bold text-lg ${selectedPlanId === plan.id ? "text-purple-800" : "text-slate-800"}`}
                >
                  {plan.title || "Untitled Plan"}
                </Text>
                {plan.description ? (
                  <Text className="text-slate-500 mt-1" numberOfLines={1}>
                    {plan.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 2. SELECT EMPLOYEE */}
        <Text className="text-slate-800 font-bold text-lg mb-3">
          2. Select an Employee
        </Text>
        {employees.length === 0 ? (
          <Text className="text-slate-500 italic mb-6">
            No employees found in the system.
          </Text>
        ) : (
          <View className="mb-24">
            {employees.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                onPress={() => setSelectedEmployeeId(emp.id)}
                className={`p-4 rounded-xl mb-3 border-2 ${selectedEmployeeId === emp.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
              >
                <Text
                  className={`font-bold text-lg ${selectedEmployeeId === emp.id ? "text-blue-800" : "text-slate-800"}`}
                >
                  {emp.username
                    ? `@${emp.username}`
                    : `Employee ID: ${emp.id.substring(0, 10)}...`}
                </Text>
                <Text className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-wider">
                  {emp.role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Assignment Action */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleAssignPlan}
          disabled={assigning || !selectedPlanId || !selectedEmployeeId}
          className={`w-full py-4 rounded-xl items-center justify-center ${
            !selectedPlanId || !selectedEmployeeId
              ? "bg-slate-300"
              : "bg-green-600"
          }`}
        >
          {assigning ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
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
