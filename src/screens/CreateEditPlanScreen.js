import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachCreatePlan, coachUpdatePlan, getPlan } from '../services/backend';

export default function CreateEditPlanScreen({ route, navigation }) {
    const { user } = useUser();
    const planId = route.params?.planId; // if editing

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (planId) {
            setLoading(true);
            getPlan(planId).then(plan => {
                if (plan) {
                    setTitle(plan.title || '');
                    setDescription(plan.description || '');
                    setTags(plan.tags ? plan.tags.join(', ') : '');
                    setIsPublished(!!plan.isPublished);
                }
                setLoading(false);
            });
        }
    }, [planId]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Required", "Plan title is required");
            return;
        }

        setLoading(true);
        try {
            const planData = {
                title,
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                isPublished,
            };

            if (planId) {
                await coachUpdatePlan(user.id, user.publicMetadata.role, planId, planData);
                Alert.alert("Success", "Plan updated!");
                navigation.goBack();
            } else {
                const newPlan = await coachCreatePlan(user.id, planData);
                Alert.alert("Success", "New plan created!");
                navigation.replace('PlanDetail', { planId: newPlan.id });
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-blue-600 font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-800">
                    {planId ? 'Edit Plan' : 'New Plan'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text className={`font-bold text-lg ${loading ? 'text-slate-400' : 'text-green-600'}`}>
                        Save
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-6">
                <Text className="text-slate-700 font-bold mb-2">Title *</Text>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Morning Routine"
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-lg"
                />

                <Text className="text-slate-700 font-bold mb-2">Description</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Brief overview of the goal."
                    multiline
                    numberOfLines={4}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-lg h-32"
                    textAlignVertical="top"
                />

                <Text className="text-slate-700 font-bold mb-2">Tags (comma separated)</Text>
                <TextInput
                    value={tags}
                    onChangeText={setTags}
                    placeholder="transit, daily, essential"
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-lg"
                />

                <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
                    <View>
                        <Text className="text-slate-800 font-bold text-lg">Published</Text>
                        <Text className="text-slate-500 text-sm">Allow clients to see this plan.</Text>
                    </View>
                    <Switch
                        value={isPublished}
                        onValueChange={setIsPublished}
                        trackColor={{ false: "#cbd5e1", true: "#3b82f6" }}
                    />
                </View>

                {/* Cover Media Placeholder */}
                <View className="mb-12">
                    <Text className="text-slate-700 font-bold mb-2">Cover Media (Placeholder)</Text>
                    <View className="h-40 bg-slate-100 rounded-xl border border-dashed border-slate-300 items-center justify-center">
                        <Text className="text-slate-400">TODO: Implement Firebase Storage Upload</Text>
                        <TouchableOpacity className="mt-4 bg-slate-200 px-4 py-2 rounded-lg">
                            <Text className="text-slate-700 font-medium">Select Image</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
