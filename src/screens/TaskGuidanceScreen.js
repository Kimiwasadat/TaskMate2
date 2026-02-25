import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import * as Speech from 'expo-speech';
import { getPlan, clientMarkStepComplete } from '../services/backend';

export default function TaskGuidanceScreen({ route, navigation }) {
    const { user } = useUser();
    const { taskId } = route.params;
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // total seconds
    const [stepTimeLeft, setStepTimeLeft] = useState(0); // step seconds

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const data = await getPlan(taskId);
                if (data) {
                    setTask(data);
                    if (timeLeft === 0 && data.durationMinutes) {
                        setTimeLeft(data.durationMinutes * 60);
                    }
                } else {
                    console.log("Task not found");
                }
            } catch (error) {
                console.error("Error fetching task:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTask();

        return () => {
            Speech.stop();
        };
    }, [taskId]);

    // Handle initial step time when task/step index loads
    useEffect(() => {
        if (task?.steps?.[currentStepIndex]?.durationMinutes) {
            setStepTimeLeft(task.steps[currentStepIndex].durationMinutes * 60);
        }
    }, [task, currentStepIndex]);

    useEffect(() => {
        if (timeLeft <= 0 && stepTimeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
            setStepTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, stepTimeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentStep = task?.steps[currentStepIndex];
    const isLastStep = currentStepIndex === (task?.steps.length || 0) - 1;

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
                rate: 0.9,
            });
        }
    };

    const handleNextStep = async () => {
        console.log("handleNextStep called", { currentStepIndex, isLastStep });
        Speech.stop();
        setIsSpeaking(false);

        if (isLastStep) {
            console.log("Last step reached, ensuring navigation to completion screen...");

            // Try updating backend in the background
            if (user) {
                clientMarkStepComplete(user.id, taskId, currentStep.id)
                    .then(() => console.log("Background backend update successful"))
                    .catch(err => console.error("Background backend update failed", err));
            }

            // Navigate immediately for the mockup experience
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

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!task) return <View className="flex-1 items-center justify-center"><Text>Task not found</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-white flex-col">
            {/* Header / Progress */}
            <View className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex-row justify-between items-center">
                <View>
                    <Text className="text-slate-500 font-bold text-lg">Step {currentStepIndex + 1} of {task.steps.length}</Text>
                    <View className="flex-row items-center">
                        {timeLeft > 0 && (
                            <Text className={`text-sm font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-slate-400'} mr-4`}>
                                Total: {formatTime(timeLeft)}
                            </Text>
                        )}
                        {stepTimeLeft > 0 && (
                            <Text className="text-sm font-bold text-blue-500">
                                ⏱ This Step: {formatTime(stepTimeLeft)}
                            </Text>
                        )}
                    </View>
                </View>
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

