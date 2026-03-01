import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen({ onNavigateToSignUp }) {
    const { signIn, setActive, isLoaded } = useSignIn();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSignInPress = async () => {
        if (!isLoaded) return;
        setLoading(true);

        try {
            const completeSignIn = await signIn.create({
                identifier: username,
                password,
            });

            // This indicates the user is signed in
            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-8 justify-center">
                <View className="mb-12 mt-8">
                    <Text className="text-3xl font-bold text-text-primary mb-2">TaskMate</Text>
                    <Text className="text-base text-text-muted">Helping you work with confidence.</Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-semibold text-text-primary mb-2">Username</Text>
                        <TextInput
                            autoCapitalize="none"
                            value={username}
                            placeholder="Enter your username"
                            placeholderTextColor="#5B667A"
                            className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary"
                            onChangeText={(text) => setUsername(text)}
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-sm font-semibold text-text-primary mb-2">Password</Text>
                        <TextInput
                            value={password}
                            placeholder="Enter your password"
                            placeholderTextColor="#5B667A"
                            className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary"
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onSignInPress}
                        disabled={loading}
                        activeOpacity={0.8}
                        className={`mt-8 h-[56px] rounded-[14px] items-center justify-center ${loading ? 'bg-primary/50' : 'bg-primary active:bg-primary-dark'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onNavigateToSignUp}
                        className="mt-6 items-center"
                    >
                        <Text className="text-text-muted text-base">
                            Don't have an account? <Text className="text-primary font-bold">Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-12 items-center">
                    <Text className="text-text-muted text-sm">TaskMate v1.0.0-phase2</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
