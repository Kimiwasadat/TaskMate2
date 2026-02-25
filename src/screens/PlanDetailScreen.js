import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPlan } from '../services/backend';

export default function PlanDetailScreen({ route, navigation }) {
    const { planId } = route.params;
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPlan = async () => {
        setLoading(true);
        const fetchedPlan = await getPlan(planId);
        setPlan(fetchedPlan);
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadPlan();
        });
        return unsubscribe;
    }, [navigation, planId]);

    const renderStep = ({ item, index }) => (
        <TouchableOpacity
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-200 flex-row items-center"
            onPress={() => navigation.navigate('AddEditStep', { planId, stepId: item.id })}
        >
            <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-4">
                <Text className="text-blue-700 font-bold">{index + 1}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
                <Text className="text-sm text-slate-500" numberOfLines={1}>{item.instruction}</Text>
            </View>
            <Text className="text-slate-400 font-medium">Edit</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!plan) return <View className="flex-1 items-center justify-center"><Text>Plan not found</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 p-6">
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-slate-500 font-bold text-lg">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('CreateEditPlan', { planId })}>
                    <Text className="text-blue-600 font-bold text-lg">Edit Plan</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-8">
                <Text className="text-3xl font-extrabold text-slate-900 mb-2">{plan.title}</Text>
                <Text className="text-slate-600 text-lg leading-6">{plan.description}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-slate-800">Steps ({plan.steps?.length || 0})</Text>
                <TouchableOpacity onPress={() => { }}>
                    <Text className="text-slate-500 font-medium">Reorder</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={plan.steps || []}
                keyExtractor={(item) => item.id}
                renderItem={renderStep}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    <TouchableOpacity
                        className="bg-dashed border-2 border-slate-300 border-dashed py-4 rounded-xl items-center mt-2 mb-8"
                        onPress={() => navigation.navigate('AddEditStep', { planId })}
                    >
                        <Text className="text-slate-500 font-bold">+ Add Step</Text>
                    </TouchableOpacity>
                }
            />
        </SafeAreaView>
    );
}
