import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';

export default function AdminDashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-3xl font-extrabold text-slate-900">Admin Portal</Text>
                <TouchableOpacity onPress={() => signOut()}>
                    <Text className="text-blue-600 font-bold">Sign Out</Text>
                </TouchableOpacity>
            </View>

            <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <Text className="text-lg text-slate-700 mb-2">Welcome Admin {user?.firstName}!</Text>
                <Text className="text-sm text-slate-500 mb-6">
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
