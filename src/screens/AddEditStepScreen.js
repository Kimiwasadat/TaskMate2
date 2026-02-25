import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachAddStep, coachUpdateStep, getPlan, coachAttachMediaToStep } from '../services/backend';

export default function AddEditStepScreen({ route, navigation }) {
    const { user } = useUser();
    const { planId, stepId } = route.params;

    const [title, setTitle] = useState('');
    const [instruction, setInstruction] = useState('');
    const [order, setOrder] = useState('');
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (stepId) {
            getPlan(planId).then(plan => {
                const step = plan?.steps?.find(s => s.id === stepId);
                if (step) {
                    setTitle(step.title || '');
                    setInstruction(step.instruction || '');
                    setOrder(step.order != null ? String(step.order) : '');
                    setMediaItems(step.media || []);
                }
            });
        }
    }, [planId, stepId]);

    const handleSave = async () => {
        if (!title.trim() || !instruction.trim()) {
            Alert.alert("Required", "Title and instruction body are required");
            return;
        }

        setLoading(true);
        try {
            const stepData = {
                title,
                instruction,
                order: parseInt(order, 10) || 0,
            };

            if (stepId) {
                await coachUpdateStep(user.id, user.publicMetadata.role, planId, stepId, stepData);
                Alert.alert("Success", "Step updated!");
            } else {
                await coachAddStep(user.id, user.publicMetadata.role, planId, stepData);
                Alert.alert("Success", "Step added!");
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAttachMedia = async () => {
        // Placeholder for file picking logic
        Alert.alert(
            "Attach Media",
            "This would open the native device file picker. Attaching a placeholder image now.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Attach Placeholder",
                    onPress: async () => {
                        if (!stepId) {
                            Alert.alert("Save first", "Please save this step before attaching media.");
                            return;
                        }

                        const mockMedia = {
                            type: "image",
                            localUri: "file:///dummy/path/image.jpg",
                            filename: `img_${Date.now()}.jpg`,
                            createdAt: Date.now()
                        };

                        try {
                            const added = await coachAttachMediaToStep(user.id, user.publicMetadata.role, planId, stepId, mockMedia);
                            setMediaItems(prev => [...prev, added]);
                        } catch (err) {
                            Alert.alert("Error attaching media", err.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-blue-600 font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-800">
                    {stepId ? 'Edit Step' : 'New Step'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text className={`font-bold text-lg ${loading ? 'text-slate-400' : 'text-green-600'}`}>
                        Save
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-6">

                <View className="flex-row gap-4 mb-6">
                    <View className="flex-[3]">
                        <Text className="text-slate-700 font-bold mb-2">Step Title *</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Gather Equipment"
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-lg"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-700 font-bold mb-2">Order</Text>
                        <TextInput
                            value={order}
                            onChangeText={setOrder}
                            placeholder="0"
                            keyboardType="numeric"
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-lg text-center"
                        />
                    </View>
                </View>

                <Text className="text-slate-700 font-bold mb-2">Instructions *</Text>
                <TextInput
                    value={instruction}
                    onChangeText={setInstruction}
                    placeholder="Provide clear, concise instructions on what to do during this step."
                    multiline
                    numberOfLines={6}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-lg h-40"
                    textAlignVertical="top"
                />

                <View className="mb-12">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-800 font-bold text-lg">Attached Media</Text>
                    </View>

                    {mediaItems.length > 0 ? (
                        mediaItems.map((m, idx) => (
                            <View key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2 flex-row justify-between items-center">
                                <Text className="text-slate-700">{m.filename}</Text>
                                <Text className="text-xs text-blue-500">{m.type}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-slate-400 mb-4 italic">No media attached yet.</Text>
                    )}

                    <TouchableOpacity
                        className="bg-slate-200 py-3 rounded-xl items-center mt-2"
                        onPress={handleAttachMedia}
                    >
                        <Text className="text-slate-700 font-bold">Attach Media (TODO: Firebase Storage)</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
