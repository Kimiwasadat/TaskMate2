import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';

export default function AdminDashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <Text className="text-3xl font-bold text-text-primary">Admin Portal</Text>
                <TouchableOpacity onPress={() => signOut()} activeOpacity={0.7}>
                    <Text className="text-primary font-bold text-base">Sign Out</Text>
                </TouchableOpacity>
            </View>

            <View className="bg-surface p-5 rounded-2xl shadow-sm border border-border mt-4">
                <Text className="text-xl font-bold text-text-primary mb-2">Welcome Admin {user?.firstName}!</Text>
                <Text className="text-base text-text-muted mb-6">
                    This is a placeholder for the Admin Dashboard where you'll be able to manage all users, system settings, and analytics.
                </Text>

                <TouchableOpacity
                    className="bg-slate-900 p-4 rounded-xl items-center"
                    onPress={() => navigation.navigate('Debug')}
                >
                    <Text className="text-white font-bold">Developer Debug Screen</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
