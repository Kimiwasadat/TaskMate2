import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROLES } from "../auth/rbac";

export default function RoleSelectionScreen({
  onSelectRole,
  onNavigateToLogin,
}) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center">
        <View className="mb-10 text-center items-center">
          <Text className="text-4xl font-extrabold text-slate-900 mb-2 text-center">
            Choose Your Role
          </Text>
          <Text className="text-lg text-slate-500 text-center">
            How will you be using TaskMate?
          </Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.CLIENT)}
            className="bg-blue-50 border border-blue-200 p-6 rounded-3xl"
          >
            <Text className="text-2xl font-bold text-blue-900 mb-1">
              Employee
            </Text>
            <Text className="text-blue-700">
              I am here to view and complete my assigned tasks.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.COACH)}
            className="bg-purple-50 border border-purple-200 p-6 rounded-3xl"
          >
            <Text className="text-2xl font-bold text-purple-900 mb-1">
              Coach
            </Text>
            <Text className="text-purple-700">
              I am here to create plans and assign them to employees.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.ADMIN)}
            className="bg-slate-50 border border-slate-300 p-6 rounded-3xl"
          >
            <Text className="text-2xl font-bold text-slate-900 mb-1">
              Admin
            </Text>
            <Text className="text-slate-600">
              I am here to oversee the organization and manage users.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNavigateToLogin}
          className="mt-8 items-center"
        >
          <Text className="text-slate-500 text-lg">
            Already have an account?{" "}
            <Text className="text-blue-600 font-bold">Log in instead</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
