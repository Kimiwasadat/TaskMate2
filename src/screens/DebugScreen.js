import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { normalizeRole } from '../auth/rbac';

export default function DebugScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();

    const role = normalizeRole(user);

    return (
        <SafeAreaView className="flex-1 bg-slate-900 p-6">
            <Text className="text-3xl font-extrabold text-white mb-6">Developer Debug</Text>

            <View className="bg-slate-800 p-4 rounded-xl mb-6">
                <Text className="text-slate-400 text-sm mb-1">User ID</Text>
                <Text className="text-white font-mono mb-4">{user?.id}</Text>

                <Text className="text-slate-400 text-sm mb-1">Email</Text>
                <Text className="text-white font-mono mb-4">{user?.primaryEmailAddress?.emailAddress}</Text>

                <Text className="text-slate-400 text-sm mb-1">Role (publicMetadata.role)</Text>
                <Text className="text-green-400 font-bold text-lg mb-2">{role}</Text>
            </View>

            <View className="bg-slate-800 p-4 rounded-xl mb-8">
                <Text className="text-white font-bold mb-2">How to change role:</Text>
                <Text className="text-slate-300 text-sm leading-6">
                    1. Go to Clerk Dashboard{'\n'}
                    2. Navigate to Users{'\n'}
                    3. Select this user{'\n'}
                    4. Under Metadata, add to publicMetadata:{'\n'}
                    <Text className="font-mono text-yellow-300">{"{\"role\": \"coach\"}"}</Text>
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-blue-600 py-4 items-center rounded-xl mb-4"
            >
                <Text className="text-white font-bold text-lg">Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => signOut()}
                className="bg-red-600 py-4 items-center rounded-xl"
            >
                <Text className="text-white font-bold text-lg">Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
