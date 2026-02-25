import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachListAssignments, getPlan } from '../services/backend';

export default function AssignmentListScreen({ navigation }) {
    const { user } = useUser();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const fetched = await coachListAssignments(user.id, user.publicMetadata.role);

            // Hydrate assignment with plan title for display
            const hydrated = await Promise.all(fetched.map(async (a) => {
                const plan = await getPlan(a.planId);
                return { ...a, planTitle: plan ? plan.title : 'Deleted Plan' };
            }));

            setAssignments(hydrated);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadAssignments();
        });
        return unsubscribe;
    }, [navigation]);

    const handlePauseRemove = (assignmentId) => {
        Alert.alert("Placeholder", `Would pause/remove assignment ${assignmentId} in Firestore.`);
    };

    const renderItem = ({ item }) => (
        <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-slate-200">
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-xl font-bold text-slate-800 flex-1">{item.planTitle}</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-800">
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text className="text-slate-600 mb-4 font-medium">Assigned to: {item.clientId}</Text>

            <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                    className="bg-slate-100 px-4 py-2 rounded-lg"
                    onPress={() => handlePauseRemove(item.assignmentId)}
                >
                    <Text className="text-slate-700 font-bold">Pause/Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-slate-500 font-bold text-lg">Back</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold text-slate-900">Assignments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Assignment')}>
                    <Text className="text-blue-600 font-bold text-lg">New</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={assignments}
                    keyExtractor={(item) => item.assignmentId}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                            <Text className="text-slate-400 text-lg">No active assignments.</Text>
                            <Text className="text-slate-400 text-sm mt-2">Tap "New" to assign a plan to a client.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
