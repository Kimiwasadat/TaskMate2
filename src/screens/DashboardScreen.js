import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { MOCK_TASKS } from '../data/mockTasks';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen({ navigation }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-slate-200"
            onPress={() => navigation.navigate('TaskGuidance', { taskId: item.id })}
        >
            <Text className="text-2xl font-bold text-slate-800 mb-2">{item.title}</Text>
            <Text className="text-lg text-slate-600 mb-4">{item.description}</Text>

            <View className="flex-row items-center justify-between">
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-800 font-semibold">{item.status === 'in_progress' ? 'In Progress' : 'Not Started'}</Text>
                </View>
                <Text className="text-slate-500 font-medium">Due: {item.dueDate}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="p-6">
                <Text className="text-4xl font-extrabold text-slate-900 mb-2">Hello, Messenger!</Text>
                <Text className="text-xl text-slate-600 mb-8">Here are your tasks for today.</Text>

                <FlatList
                    data={MOCK_TASKS}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
}
