import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import {
  getAllCoaches,
  getAllEmployees,
  assignEmployeeToCoach,
  unassignEmployeeFromCoach,
} from "../services/firestoreService";

export default function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState(null);

  // We assign a local state "assignedIds" so the UI updates instantly
  // without needing to refetch the entire coach list from Firestore every click
  const [assignedIds, setAssignedIds] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [fetchedCoaches, fetchedEmployees] = await Promise.all([
        getAllCoaches(),
        getAllEmployees(),
      ]);
      setCoaches(fetchedCoaches);
      setEmployees(fetchedEmployees);
    } catch (error) {
      console.error("Error loading users for admin:", error);
      Alert.alert("Error", "Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoach = (coach) => {
    setSelectedCoach(coach);
    setAssignedIds(coach.assignedEmployees || []);
  };

  const handleToggleAssignment = async (employeeId, isAssigned) => {
    if (!selectedCoach) return;

    try {
      if (isAssigned) {
        // Unassign
        await unassignEmployeeFromCoach(selectedCoach.id, employeeId);
        setAssignedIds((prev) => prev.filter((id) => id !== employeeId));
      } else {
        // Assign
        await assignEmployeeToCoach(selectedCoach.id, employeeId);
        setAssignedIds((prev) => [...prev, employeeId]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not update assignment.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderCoachCard = ({ item }) => {
    const isSelected = selectedCoach?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleSelectCoach(item)}
        className={`p-4 rounded-xl mb-3 border ${
          isSelected
            ? "bg-purple-50 border-purple-500"
            : "bg-white border-slate-200"
        }`}
      >
        <Text
          className={`font-bold text-lg ${
            isSelected ? "text-purple-900" : "text-slate-800"
          }`}
        >
          {item.username ? `@${item.username}` : "Unknown Coach"}
        </Text>
        <Text className="text-slate-500 text-sm">
          {item.assignedEmployees?.length || 0} Employees Assigned
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmployeeCard = ({ item }) => {
    const isAssigned = assignedIds.includes(item.id);

    return (
      <View className="flex-row justify-between items-center bg-white p-4 rounded-xl mb-3 border border-slate-200">
        <View>
          <Text className="font-bold text-slate-800 text-base">
            {item.username ? `@${item.username}` : "Unknown"}
          </Text>
          <Text className="text-slate-500 text-xs">Employee</Text>
        </View>

        {selectedCoach ? (
          <TouchableOpacity
            onPress={() => handleToggleAssignment(item.id, isAssigned)}
            className={`px-4 py-2 rounded-full ${
              isAssigned ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                isAssigned ? "text-red-700" : "text-blue-700"
              }`}
            >
              {isAssigned ? "Remove" : "Assign"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="px-4 py-2 bg-slate-100 rounded-full">
            <Text className="text-slate-400 font-bold text-xs">
              Select Coach
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#9333ea" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-6 border-b border-slate-200 bg-white flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">
            Admin Panel
          </Text>
          <Text className="text-slate-500">Manage Coach Assignments</Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-50 px-4 py-2 rounded-full"
        >
          <Text className="text-red-600 font-bold">Log Out</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Side: Coaches List */}
        <View className="w-1/2 p-4 border-r border-slate-200">
          <Text className="text-lg font-bold text-slate-800 mb-4">
            1. Select Coach
          </Text>
          {coaches.length === 0 ? (
            <Text className="text-slate-400">No coaches found.</Text>
          ) : (
            <FlatList
              data={coaches}
              keyExtractor={(item) => item.id}
              renderItem={renderCoachCard}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Right Side: Employees List */}
        <View className="w-1/2 p-4">
          <Text className="text-lg font-bold text-slate-800 mb-4">
            2. Assign Employees
          </Text>
          {!selectedCoach ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-slate-400 text-center px-4">
                Select a Coach on the left to assign or remove employees.
              </Text>
            </View>
          ) : employees.length === 0 ? (
            <Text className="text-slate-400">No employees found.</Text>
          ) : (
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              renderItem={renderEmployeeCard}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
