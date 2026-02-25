import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hasRequiredRole, normalizeRole } from '../auth/rbac';

export default function RequireRole({ children, allowed }) {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();

    if (!isLoaded || !user) {
        return null; // Or a loading spinner
    }

    if (!hasRequiredRole(user, allowed)) {
        const currentRole = normalizeRole(user);
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
                <Text className="text-3xl font-extrabold text-red-600 mb-4">Access Denied</Text>
                <Text className="text-lg text-slate-700 text-center mb-2">
                    You do not have permission to view this page.
                </Text>
                <Text className="text-md text-slate-500 mb-8">
                    Current Role: <Text className="font-bold text-slate-800">{currentRole}</Text>
                </Text>

                <TouchableOpacity
                    onPress={() => signOut()}
                    className="bg-slate-900 py-4 px-8 rounded-2xl"
                >
                    <Text className="text-white font-bold text-lg">Sign Out</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Role is allowed, render children
    return <>{children}</>;
}
