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
      });

      // Because email verification is disabled in Clerk, creation succeeds immediately.

      // Save the role to Clerk's publicMetadata so the Navigation router can read it
      await signUp.update({
        publicMetadata: {
          role: selectedRole,
        },
      });

      await setActive({ session: completeSignUp.createdSessionId });

      // Sync the new user to Firestore
      await saveUserToFirestore(completeSignUp.createdUserId, selectedRole);
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
          <View className="mb-12">
            <Text className="text-5xl font-extrabold text-slate-900 mb-2">
              Create Account
            </Text>
            <Text className="text-xl text-slate-500">
              Join TaskMate and get started.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-lg font-bold text-slate-700 mb-2">
                Username
              </Text>
              <TextInput
                autoCapitalize="none"
                value={username}
                placeholder="Choose a username"
                className="bg-slate-100 p-5 rounded-2xl text-xl"
                onChangeText={(text) => setUsername(text)}
              />
            </View>

            <View className="mt-4">
              <Text className="text-lg font-bold text-slate-700 mb-2">
                Password
              </Text>
              <TextInput
                value={password}
                placeholder="Create a strong password"
                className="bg-slate-100 p-5 rounded-2xl text-xl"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
              />
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={loading}
              className={`mt-8 py-5 rounded-2xl items-center justify-center ${loading ? "bg-blue-400" : "bg-blue-600"}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-extrabold text-2xl">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToLogin}
              className="mt-6 items-center"
            >
              <Text className="text-slate-500 text-lg">
                Already have an account?{" "}
                <Text className="text-blue-600 font-bold">Log in instead</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateBack}
              className="mt-4 items-center"
            >
              <Text className="text-slate-400 font-bold">← Change Role</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
