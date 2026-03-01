import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

import { saveUserToFirestore } from "../services/firestoreService";

export default function SignUpScreen({
  selectedRole,
  onNavigateToLogin,
  onNavigateBack,
}) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.create({
        username,
        password,
        unsafeMetadata: {
          role: selectedRole,
        },
      });

      // Because email verification is disabled in Clerk, creation succeeds immediately.
      await setActive({ session: completeSignUp.createdSessionId });

      // Sync the new user to Firestore
      await saveUserToFirestore(
        completeSignUp.createdUserId,
        selectedRole,
        username,
      );
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors?.[0]?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-8"
        >
          <View className="mb-12 mt-8">
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Create Account
            </Text>
            <Text className="text-base text-text-muted">
              Join TaskMate and get started.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-semibold text-text-primary mb-2">
                Username
              </Text>
              <TextInput
                autoCapitalize="none"
                value={username}
                placeholder="Choose a username"
                placeholderTextColor="#5B667A"
                className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary"
                onChangeText={(text) => setUsername(text)}
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-text-primary mb-2">
                Password
              </Text>
              <TextInput
                value={password}
                placeholder="Create a strong password"
                placeholderTextColor="#5B667A"
                className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
              />
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={loading}
              activeOpacity={0.8}
              className={`mt-8 h-[56px] rounded-[14px] items-center justify-center ${loading ? "bg-primary/50" : "bg-primary active:bg-primary-dark"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToLogin}
              className="mt-6 items-center"
            >
              <Text className="text-text-muted text-base">
                Already have an account?{" "}
                <Text className="text-primary font-bold">Log in instead</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateBack}
              className="mt-8 items-center"
            >
              <Text className="text-text-muted font-bold text-base">← Change Role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
