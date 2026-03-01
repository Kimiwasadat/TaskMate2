import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachListAssignments, getPlan } from '../services/backend';
import LoadingLogo from '../components/LoadingLogo';

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
        <View className="bg-surface p-5 rounded-2xl mb-4 shadow-sm border border-border">
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-xl font-bold text-text-primary flex-1">{item.planTitle}</Text>
                <View className="bg-accent/20 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-accent-dark">
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text className="text-text-muted mb-4 font-medium mt-1">Assigned to: {item.clientId}</Text>

            <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                    className="bg-surface border border-border px-4 py-2 rounded-[14px]"
                    activeOpacity={0.7}
                    onPress={() => handlePauseRemove(item.assignmentId)}
                >
                    <Text className="text-text-primary font-bold text-sm">Pause/Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text className="text-text-muted font-bold text-base">Back</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-text-primary">Assignments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Assignment')} activeOpacity={0.7}>
                    <Text className="text-primary font-bold text-base">New</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <LoadingLogo />
                </View>
            ) : (
                <FlatList
                    data={assignments}
                    keyExtractor={(item) => item.assignmentId}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 bg-surface rounded-2xl border border-border mt-4">
                            <Text className="text-text-muted font-semibold text-base mb-1">No active assignments.</Text>
                            <Text className="text-text-muted text-sm mt-2">Tap "New" to assign a plan to a client.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
