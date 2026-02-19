import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from "@clerk/clerk-expo";
import { taskService } from '../services/taskService';

export default function DashboardScreen({ navigation }) {
    const { user } = useUser();
    const { signOut } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Seed mock data if empty (prototype only)
        taskService.seedMockData();

        // Subscribe to real-time updates
        const unsubscribe = taskService.subscribeToTasks((fetchedTasks) => {
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Global timer to force refresh every second for live countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            setTasks(prevTasks => [...prevTasks]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (minutes) => {
        if (!minutes) return '--:--';
        const totalSeconds = minutes * 60;
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-slate-200"
            onPress={() => navigation.navigate('TaskGuidance', { taskId: item.id })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-2xl font-bold text-slate-800 flex-1 mr-2">{item.title}</Text>
                <View className={`px-3 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <Text className={`font-semibold ${item.status === 'completed' ? 'text-green-800' : 'text-blue-800'}`}>
                        {item.status === 'completed' ? 'Done' : item.status === 'in_progress' ? 'Started' : 'To Do'}
                    </Text>
                </View>
            </View>

            <Text className="text-lg text-slate-600 mb-4" numberOfLines={2}>{item.description}</Text>

            <View className="flex-row items-center justify-between">
                <View>
                    <Text className="text-slate-400 font-medium">From: {item.assignedBy || 'Coach'}</Text>
                    {item.durationMinutes && (
                        <Text className={`font-bold text-sm ${item.status === 'in_progress' ? 'text-orange-500' : 'text-blue-500'}`}>
                            {item.status === 'in_progress' ? '⏳ Ticking...' : '⏱'} {item.durationMinutes} mins
                        </Text>
                    )}
                </View>
                <Text className="text-slate-500 font-medium">{item.dueDate}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="p-6 flex-1">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-4xl font-extrabold text-slate-900">Hello, {user?.firstName || 'Messenger'}!</Text>
                    <TouchableOpacity onPress={() => signOut()}>
                        <Text className="text-blue-600 font-bold text-lg">Sign Out</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-xl text-slate-600 mb-8">Here are your tasks for today.</Text>

                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Text className="text-slate-400 text-lg">No tasks assigned yet.</Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

