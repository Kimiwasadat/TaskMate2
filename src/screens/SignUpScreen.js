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
import TaskMateLogoStatic from "../components/TaskMateLogoStatic";

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
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-8"
        >
          <View className="mb-12 mt-8 items-center text-center">
            <TaskMateLogoStatic variant="light" scale={0.7} showText={false} />
            <Text className="text-4xl font-black text-white mt-4 mb-2 tracking-tight">
              Create Account
            </Text>
            <Text className="text-base text-white/80 font-medium">
              Join TaskMate and get started.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-bold text-white mb-2 ml-1">
                Username
              </Text>
              <TextInput
                autoCapitalize="none"
                value={username}
                placeholder="Choose a username"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl text-base text-white font-medium shadow-sm"
                onChangeText={(text) => setUsername(text)}
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-bold text-white mb-2 ml-1">
                Password
              </Text>
              <TextInput
                value={password}
                placeholder="Create a strong password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl text-base text-white font-medium shadow-sm"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
              />
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={loading}
              activeOpacity={0.8}
              className={`mt-8 h-[56px] rounded-[16px] items-center justify-center shadow-lg ${loading ? "bg-white/70" : "bg-white active:bg-gray-100"}`}
            >
              {loading ? (
                <ActivityIndicator color="#14b8b8" />
              ) : (
                <Text className="text-primary-dark font-black text-lg">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToLogin}
              className="mt-6 items-center"
            >
              <Text className="text-white/80 text-base font-medium">
                Already have an account?{" "}
                <Text className="text-white font-black underline">Log in instead</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateBack}
              className="mt-8 items-center"
            >
              <Text className="text-white/60 font-bold text-base">← Change Role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
