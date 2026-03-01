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
          <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
            Choose Your Role
          </Text>
          <Text className="text-base text-text-muted text-center mt-2">
            How will you be using TaskMate?
          </Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.CLIENT)}
            activeOpacity={0.7}
            className="bg-surface border border-border p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-bold text-text-primary mb-1">
              Employee
            </Text>
            <Text className="text-text-muted">
              I am here to view and complete my assigned tasks.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.COACH)}
            activeOpacity={0.7}
            className="bg-surface border border-border p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-bold text-text-primary mb-1">
              Coach
            </Text>
            <Text className="text-text-muted">
              I am here to create plans and assign them to employees.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onSelectRole(ROLES.ADMIN)}
            activeOpacity={0.7}
            className="bg-surface border border-border p-5 rounded-2xl shadow-sm"
          >
            <Text className="text-xl font-bold text-text-primary mb-1">
              Admin
            </Text>
            <Text className="text-text-muted">
              I am here to oversee the organization and manage users.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNavigateToLogin}
          className="mt-8 items-center"
        >
          <Text className="text-text-muted text-base">
            Already have an account?{" "}
            <Text className="text-primary font-bold">Log in instead</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
