import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import {
  getAllCoaches,
  getAllEmployees,
  assignEmployeeToCoach,
  unassignEmployeeFromCoach,
} from "../services/firestoreService";
import DashboardHeader from "../components/DashboardHeader";
import LoadingLogo from "../components/LoadingLogo";

export default function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState(null);

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
        await unassignEmployeeFromCoach(selectedCoach.id, employeeId);
        setAssignedIds((prev) => prev.filter((id) => id !== employeeId));
        setCoaches((prevCoaches) =>
          prevCoaches.map((coach) =>
            coach.id === selectedCoach.id
              ? {
                  ...coach,
                  assignedEmployees: (coach.assignedEmployees || []).filter(
                    (id) => id !== employeeId,
                  ),
                }
              : coach,
          ),
        );
      } else {
        await assignEmployeeToCoach(selectedCoach.id, employeeId);
        setAssignedIds((prev) => [...prev, employeeId]);
        setCoaches((prevCoaches) =>
          prevCoaches.map((coach) =>
            coach.id === selectedCoach.id
              ? {
                  ...coach,
                  assignedEmployees: [
                    ...(coach.assignedEmployees || []),
                    employeeId,
                  ],
                }
              : coach,
          ),
        );
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
        activeOpacity={0.7}
        className={`p-5 rounded-2xl mb-4 border shadow-sm ${
          isSelected
            ? "bg-primary/10 border-primary"
            : "bg-surface border-border"
        }`}
      >
        <Text
          className={`font-bold text-lg mb-2 ${
            isSelected ? "text-primary-dark" : "text-text-primary"
          }`}
        >
          {item.username ? `@${item.username}` : "Unknown Coach"}
        </Text>
        <View className="flex-row items-center">
          <View className="bg-primary/20 px-3 py-1 rounded-full">
            <Text className="text-primary-dark text-xs font-bold tracking-wide">
              {item.assignedEmployees?.length || 0} Assigned
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmployeeCard = ({ item }) => {
    const isAssigned = assignedIds.includes(item.id);

    return (
      <View className="flex-row justify-between items-center bg-surface p-5 rounded-2xl mb-4 border border-border shadow-sm">
        <View>
          <Text className="font-bold text-lg text-text-primary mb-1">
            {item.username ? `@${item.username}` : "Unknown"}
          </Text>
          <Text className="text-text-muted text-sm font-medium">Employee</Text>
        </View>

        {selectedCoach ? (
          <TouchableOpacity
            onPress={() => handleToggleAssignment(item.id, isAssigned)}
            activeOpacity={0.7}
            className={`px-4 py-2 rounded-full border ${
              isAssigned
                ? "bg-red-50 border-red-200"
                : "bg-primary/10 border-primary/20"
            }`}
          >
            <Text
              className={`font-bold text-sm ${
                isAssigned ? "text-red-700" : "text-primary-dark"
              }`}
            >
              {isAssigned ? "Remove" : "Assign"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
            <Text className="text-gray-400 font-bold text-sm">
              Select Coach
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <LoadingLogo />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="pt-12 pb-8 bg-primary rounded-b-3xl shadow-sm z-10">
        <DashboardHeader
          variant="light"
          rightContent={
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              className="bg-primary-dark/50 border border-white/20 px-4 py-2 rounded-full"
            >
              <Text className="text-white font-bold text-sm">Log Out</Text>
            </TouchableOpacity>
          }
        />
        <View className="px-6 mt-4 flex-row justify-between items-end">
          <View>
            <Text className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">
              Admin Panel
            </Text>
            <Text
              className="text-white text-3xl font-black tracking-tight"
              numberOfLines={1}
            >
              Assignments
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 flex-row px-4 pt-6 -mt-2">
        {/* Left Side: Coaches List */}
        <View className="w-[45%] pr-4 border-r border-border">
          <Text className="text-xl font-bold text-text-primary mb-4 tracking-tight">
            1. Select Coach
          </Text>
          {coaches.length === 0 ? (
            <Text className="text-text-muted text-base font-medium text-center mt-10">
              No coaches found.
            </Text>
          ) : (
            <FlatList
              data={coaches}
              keyExtractor={(item) => item.id}
              renderItem={renderCoachCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

        {/* Right Side: Employees List */}
        <View className="w-[55%] pl-4">
          <Text className="text-xl font-bold text-text-primary mb-4 tracking-tight">
            2. Assign Employees
          </Text>
          {!selectedCoach ? (
            <View className="flex-1 mt-10 items-center">
              <Text className="text-text-muted text-center text-base font-medium px-4">
                Select a Coach on the left to assign or remove employees.
              </Text>
            </View>
          ) : employees.length === 0 ? (
            <Text className="text-text-muted text-base font-medium text-center mt-10">
              No employees found.
            </Text>
          ) : (
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              renderItem={renderEmployeeCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
