import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateAndPlayAudio } from "../services/ttsService";

export default function TaskCompleteScreen({ navigation }) {
    useEffect(() => {
        let currentSound = null;

        const playCongrats = async () => {
            try {
                const sound = await generateAndPlayAudio("Great job! You have finished this task.");
                if (sound) {
                    currentSound = sound;
                    sound.setOnPlaybackStatusUpdate((status) => {
                        if (status.didJustFinish) {
                            sound.unloadAsync();
                            currentSound = null;
                        }
                    });
                }
            } catch (err) {
                console.error("Congrats audio failed:", err);
            }
        };

        playCongrats();

        return () => {
            if (currentSound) {
                currentSound.unloadAsync();
            }
        };
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-accent items-center justify-center p-6">
            <View className="bg-surface p-8 rounded-3xl w-full items-center shadow-md">
                <Text className="text-6xl mb-4">🎉</Text>
                <Text className="text-3xl font-bold text-text-primary text-center mb-2">Great Job!</Text>
                <Text className="text-lg font-medium text-text-muted text-center mb-8">You finished the task.</Text>

                <TouchableOpacity
                    className="bg-primary w-full h-[56px] rounded-[14px] justify-center items-center active:bg-primary-dark"
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <Text className="text-white font-bold text-lg">Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
