import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import DashboardHeader from "../components/DashboardHeader";

export default function AdminDashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <DashboardHeader
                rightContent={
                    <TouchableOpacity onPress={() => signOut()} activeOpacity={0.7} className="bg-surface border border-border px-4 py-2 rounded-full shadow-sm">
                        <Text className="text-primary-dark font-bold text-sm">Sign Out</Text>
                    </TouchableOpacity>
                }
            />
            <View className="px-6 flex-1">
                <Text className="text-3xl font-black text-text-primary mt-2 mb-6">
                    Admin Portal
                </Text>

                <View className="bg-surface p-5 rounded-2xl shadow-sm border border-border">
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
            </View>
        </SafeAreaView>
    );
}
