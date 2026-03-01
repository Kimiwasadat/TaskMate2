import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROLES } from "../auth/rbac";
import TaskMateLogoStatic from "../components/TaskMateLogoStatic";

export default function RoleSelectionScreen({
  onSelectRole,
  onNavigateToLogin,
}) {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 px-8 justify-center">
        <View className="mb-10 text-center items-center">
          <TaskMateLogoStatic variant="light" scale={0.7} showText={false} />
          <Text className="text-4xl font-black text-white mt-4 mb-2 text-center tracking-tight">
            Choose Your Role
          </Text>
          <Text className="text-base text-white/80 font-medium text-center mt-2">
            How will you be using TaskMate?
          </Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.CLIENT)}
            activeOpacity={0.7}
            className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-black text-white mb-1">
              Employee
            </Text>
            <Text className="text-white/80 font-medium">
              I am here to view and complete my assigned tasks.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.COACH)}
            activeOpacity={0.7}
            className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-black text-white mb-1">
              Coach
            </Text>
            <Text className="text-white/80 font-medium">
              I am here to create plans and assign them to employees.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.ADMIN)}
            activeOpacity={0.7}
            className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-black text-white mb-1">
              Admin
            </Text>
            <Text className="text-white/80 font-medium">
              I am here to oversee the organization and manage users.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNavigateToLogin}
          className="mt-8 items-center"
        >
          <Text className="text-white/80 text-base font-medium">
            Already have an account?{" "}
            <Text className="text-white font-black underline">Log in instead</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
