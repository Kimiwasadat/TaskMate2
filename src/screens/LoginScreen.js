import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import TaskMateLogoStatic from "../components/TaskMateLogoStatic";

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
        <SafeAreaView className="flex-1 bg-primary">
            <View className="flex-1 px-8 justify-center">
                <View className="mb-12 mt-8 items-center text-center">
                    <TaskMateLogoStatic variant="light" scale={0.7} showText={false} />
                    <Text className="text-4xl font-black text-white mt-4 mb-2 tracking-tight">TaskMate</Text>
                    <Text className="text-base text-white/80 font-medium">Helping you work with confidence.</Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-bold text-white mb-2 ml-1">Username</Text>
                        <TextInput
                            autoCapitalize="none"
                            value={username}
                            placeholder="Enter your username"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl text-base text-white font-medium shadow-sm"
                            onChangeText={(text) => setUsername(text)}
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-sm font-bold text-white mb-2 ml-1">Password</Text>
                        <TextInput
                            value={password}
                            placeholder="Enter your password"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            className="bg-primary-dark/40 border border-white/20 p-5 rounded-2xl text-base text-white font-medium shadow-sm"
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onSignInPress}
                        disabled={loading}
                        activeOpacity={0.8}
                        className={`mt-8 h-[56px] rounded-[16px] items-center justify-center shadow-lg ${loading ? 'bg-white/70' : 'bg-white active:bg-gray-100'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#14b8b8" />
                        ) : (
                            <Text className="text-primary-dark font-black text-lg">Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onNavigateToSignUp}
                        className="mt-6 items-center"
                    >
                        <Text className="text-white/80 text-base font-medium">
                            Don't have an account? <Text className="text-white font-black underline">Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-12 items-center">
                    <Text className="text-white/40 text-sm font-medium tracking-wide">TaskMate v1.0.0-phase2</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
