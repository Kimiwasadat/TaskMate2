import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { coachListPlans, normalizeRole } from '../services/backend';

export default function CoachDashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const fetchedPlans = await coachListPlans(user.id, user.publicMetadata.role);
            setPlans(fetchedPlans);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadPlans();
        });
        return unsubscribe;
    }, [navigation, user]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-slate-200"
            onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-xl font-bold text-slate-800 flex-1 mr-2">{item.title}</Text>
                <View className={`px-3 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <Text className={`text-xs font-semibold ${item.status === 'completed' ? 'text-green-800' : 'text-blue-800'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text className="text-slate-600 mb-2" numberOfLines={2}>{item.description}</Text>
            <View className="flex-row justify-between items-center mt-2">
                <Text className="text-sm font-medium text-slate-400">
                    {item.steps?.length || 0} Steps
                </Text>
                <Text className={`text-xs font-bold ${item.isPublished ? 'text-green-500' : 'text-orange-500'}`}>
                    {item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-3xl font-extrabold text-slate-900">Coach Portal</Text>
                <TouchableOpacity onPress={() => signOut()}>
                    <Text className="text-red-500 font-bold">Sign Out</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                    className="flex-1 bg-blue-600 py-4 rounded-xl items-center shadow-sm"
                    onPress={() => navigation.navigate('CreateEditPlan')}
                >
                    <Text className="text-white font-bold">Create New Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 bg-slate-800 py-4 rounded-xl items-center shadow-sm"
                    onPress={() => navigation.navigate('AssignmentList')}
                >
                    <Text className="text-white font-bold">Assignments</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-slate-700">Your Plans</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Debug')}>
                    <Text className="text-slate-400 font-medium">Debug Auth</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                            <Text className="text-slate-400 text-lg">No plans created yet.</Text>
                            <Text className="text-slate-400 text-sm mt-2">Tap "Create New Plan" to start.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
