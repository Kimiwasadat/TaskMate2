import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSignInPress = async () => {
        if (!isLoaded) return;
        setLoading(true);

        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
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
                <View className="mb-12">
                    <Text className="text-5xl font-extrabold text-slate-900 mb-2">TaskMate</Text>
                    <Text className="text-xl text-slate-500">Helping you work with confidence.</Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-lg font-bold text-slate-700 mb-2">Email</Text>
                        <TextInput
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="name@email.com"
                            className="bg-slate-100 p-5 rounded-2xl text-xl"
                            onChangeText={(email) => setEmailAddress(email)}
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-lg font-bold text-slate-700 mb-2">Password</Text>
                        <TextInput
                            value={password}
                            placeholder="Enter your password"
                            className="bg-slate-100 p-5 rounded-2xl text-xl"
                            secureTextEntry={true}
                            onChangeText={(password) => setPassword(password)}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onSignInPress}
                        disabled={loading}
                        className={`mt-8 py-5 rounded-2xl items-center justify-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-extrabold text-2xl">Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="mt-12 items-center">
                    <Text className="text-slate-400">TaskMate v1.0.0-phase2</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
