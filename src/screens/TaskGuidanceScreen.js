import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { MOCK_TASKS } from '../data/mockTasks';

export default function TaskGuidanceScreen({ route, navigation }) {
    const { taskId } = route.params;
    const task = MOCK_TASKS.find(t => t.id === taskId);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const currentStep = task?.steps[currentStepIndex];
    const isLastStep = currentStepIndex === (task?.steps.length || 0) - 1;

    useEffect(() => {
        // Auto-read step when it loads (optional, maybe user setting later)
        // speakText();
        return () => Speech.stop();
    }, [currentStepIndex]);

    const speakText = () => {
        const textToSpeak = currentStep?.ttsText || currentStep?.instruction;
        if (!textToSpeak) return;

        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            Speech.speak(textToSpeak, {
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                rate: 0.9, // Slightly slower for clarity
            });
        }
    };

    const handleNextStep = () => {
        Speech.stop();
        setIsSpeaking(false);
        if (isLastStep) {
            navigation.replace('TaskComplete');
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        Speech.stop();
        setIsSpeaking(false);
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    if (!task) return <View className="flex-1 items-center justify-center"><Text>Task not found</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-white flex-col">
            {/* Header / Progress */}
            <View className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex-row justify-between items-center">
                <Text className="text-slate-500 font-bold text-lg">Step {currentStepIndex + 1} of {task.steps.length}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-blue-600 font-bold text-lg">Exit</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 px-6 justify-center">

                {/* Visual Placeholder (Video/Image) */}
                <View className="w-full h-64 bg-slate-200 rounded-3xl mb-8 items-center justify-center">
                    <Text className="text-slate-400 font-semibold text-lg">
                        {currentStep.mediaContent || "[ Visual Guide Here ]"}
                    </Text>
                </View>

                {/* Text Instruction - Large & Clear */}
                <Text className="text-3xl font-extrabold text-slate-900 text-center leading-tight mb-8">
                    {currentStep.instruction}
                </Text>

                {/* Accessibility Toolbar */}
                <View className="flex-row justify-center mb-8">
                    <TouchableOpacity
                        onPress={speakText}
                        className={`flex-row items-center px-6 py-3 rounded-full ${isSpeaking ? 'bg-orange-100' : 'bg-blue-50'}`}
                    >
                        <Text className="text-3xl mr-3">{isSpeaking ? '🔊' : '🔈'}</Text>
                        <Text className={`text-lg font-bold ${isSpeaking ? 'text-orange-700' : 'text-blue-700'}`}>
                            {isSpeaking ? 'Stop Reading' : 'Read to Me'}
                        </Text>
                    </TouchableOpacity>
                </View>

            </View>

            {/* Bottom Controls - BIG TARGETS */}
            <View className="px-6 pb-8 pt-4 border-t border-slate-100 bg-white">
                <View className="flex-row gap-4">

                    {/* Back Button (Small) */}
                    {currentStepIndex > 0 && (
                        <TouchableOpacity
                            onPress={handlePrevStep}
                            className="flex-1 bg-slate-200 rounded-2xl items-center justify-center py-5"
                        >
                            <Text className="text-slate-600 font-bold text-xl">Back</Text>
                        </TouchableOpacity>
                    )}

                    {/* Next/Done Button (Huge) */}
                    <TouchableOpacity
                        onPress={handleNextStep}
                        className={`flex-[2] rounded-2xl items-center justify-center py-5 ${isLastStep ? 'bg-green-600' : 'bg-blue-600'}`}
                    >
                        <Text className="text-white font-extrabold text-2xl">
                            {isLastStep ? 'FINISH TASK' : 'NEXT STEP'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
