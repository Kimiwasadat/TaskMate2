import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase-config";
import { taskService } from '../services/taskService';
import { MOCK_TASKS } from '../data/mockTasks';
import { useUI } from '../context/UIContext';

export default function TaskGuidanceScreen({ route, navigation }) {
    const { taskId } = route.params;
    const { fontSizeLevel, toggleFontSize } = useUI();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // total seconds
    const [stepTimeLeft, setStepTimeLeft] = useState(0); // step seconds

    useEffect(() => {
        // Subscribe to this specific task
        const unsubscribe = onSnapshot(doc(db, "tasks", taskId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTask({ id: doc.id, ...data });
                // Initialize timer if not already set
                if (timeLeft === 0 && data.durationMinutes) {
                    setTimeLeft(data.durationMinutes * 60);
                }
            } else {
                console.log("Firestore task record not found, checking mock data...");
                const mockTask = MOCK_TASKS.find(t => t.id === taskId);
                if (mockTask) {
                    setTask(mockTask);
                    if (timeLeft === 0 && mockTask.durationMinutes) {
                        setTimeLeft(mockTask.durationMinutes * 60);
                    }
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore error, falling back to mock data:", error);
            const mockTask = MOCK_TASKS.find(t => t.id === taskId);
            if (mockTask) setTask(mockTask);
            setLoading(false);
        });

        return () => {
            unsubscribe();
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

    const speakText = async () => {
        const textToSpeak = currentStep?.ttsText || currentStep?.instruction;
        if (!textToSpeak) return;

        try {
            if (isSpeaking) {
                await Speech.stop();
                setIsSpeaking(false);
            } else {
                // Explicitly stop any existing speech first
                await Speech.stop();

                // Small delay to ensure the native engine is ready
                setTimeout(() => {
                    setIsSpeaking(true);
                    Speech.speak(textToSpeak, {
                        onDone: () => setIsSpeaking(false),
                        onStopped: () => setIsSpeaking(false),
                        onError: (error) => {
                            console.error("Speech Error:", error);
                            setIsSpeaking(false);
                        },
                        rate: 0.9,
                    });
                }, 100);
            }
        } catch (error) {
            console.error("Speech implementation error:", error);
            setIsSpeaking(false);
        }
    };

    const handleNextStep = async () => {
        console.log("handleNextStep called", { currentStepIndex, isLastStep });
        Speech.stop();
        setIsSpeaking(false);

        // Update current step as completed in Firestore
        const updatedSteps = [...task.steps];
        updatedSteps[currentStepIndex] = { ...updatedSteps[currentStepIndex], isCompleted: true };

        if (isLastStep) {
            console.log("Last step reached, ensuring navigation to completion screen...");

            // Update entire task status and final steps array
            taskService.updateTask(taskId, {
                status: 'completed',
                isCompleted: true,
                steps: updatedSteps
            })
                .then(() => console.log("Background Firestore update successful"))
                .catch(err => console.error("Background Firestore update failed", err));

            // Navigate immediately for the mockup experience
            navigation.replace('TaskComplete');
        } else {
            // Update step-by-step progress in Firestore
            taskService.updateTask(taskId, {
                steps: updatedSteps
            })
                .then(() => console.log("Step progress updated in Firestore"))
                .catch(err => console.error("Step progress update failed", err));

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

    // Font size scaling logic
    const getFontSize = (baseSize) => {
        const scale = fontSizeLevel === 1 ? 1 : fontSizeLevel === 2 ? 1.25 : 1.5;
        return baseSize * scale;
    };

    return (
        <SafeAreaView className="flex-1 bg-white flex-col">
            {/* Header / Progress */}
            <View className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                        <Text
                            style={{ fontSize: getFontSize(18) }}
                            className="text-slate-500 font-bold"
                        >
                            Step {currentStepIndex + 1} of {task.steps.length}
                        </Text>

                        <View className="mt-2 flex-row flex-wrap items-center">
                            {timeLeft > 0 && (
                                <Text
                                    style={{ fontSize: getFontSize(14) }}
                                    className={`font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-slate-400'} mr-4`}
                                >
                                    Total: {formatTime(timeLeft)}
                                </Text>
                            )}
                            {stepTimeLeft > 0 && (
                                <View className="bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 shadow-sm">
                                    <Text
                                        style={{ fontSize: getFontSize(22) }}
                                        className="font-black text-blue-700"
                                    >
                                        ⏱ This Step: {formatTime(stepTimeLeft)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {/* Text Size Toggle Button */}
                        <TouchableOpacity
                            onPress={toggleFontSize}
                            className="bg-slate-200 p-3 rounded-full shadow-sm border border-slate-300"
                            accessibilityLabel="Increase text size"
                        >
                            <Text className="text-xl font-bold text-slate-700">A<Text className="text-sm">A</Text>+</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text
                                style={{ fontSize: getFontSize(18) }}
                                className="text-blue-600 font-bold"
                            >
                                Exit
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Main Content Area */}
            <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}>

                {/* Visual Placeholder (Video/Image) */}
                <View className="w-full h-64 bg-slate-200 rounded-3xl mb-8 items-center justify-center">
                    <Text className="text-slate-400 font-semibold text-lg">
                        {currentStep.mediaContent || "[ Visual Guide Here ]"}
                    </Text>
                </View>

                {/* Text Instruction - Large & Clear */}
                <Text
                    style={{ fontSize: getFontSize(30) }}
                    className="font-extrabold text-slate-900 text-center leading-tight mb-8"
                >
                    {currentStep.instruction}
                </Text>

                {/* Accessibility Toolbar */}
                <View className="flex-row justify-center mb-8">
                    <TouchableOpacity
                        onPress={speakText}
                        className={`flex-row items-center px-6 py-3 rounded-full ${isSpeaking ? 'bg-orange-100' : 'bg-blue-50'}`}
                    >
                        <Text style={{ fontSize: getFontSize(30) }} className="mr-3">{isSpeaking ? '🔊' : '🔈'}</Text>
                        <Text
                            style={{ fontSize: getFontSize(18) }}
                            className={`font-bold ${isSpeaking ? 'text-orange-700' : 'text-blue-700'}`}
                        >
                            {isSpeaking ? 'Stop Reading' : 'Read to Me'}
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

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
                        <Text
                            style={{ fontSize: getFontSize(24) }}
                            className="text-white font-extrabold"
                        >
                            {isLastStep ? 'FINISH TASK' : 'NEXT STEP'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

