import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

export default function TaskCompleteScreen({ navigation }) {
    useEffect(() => {
        Speech.speak("Great job! You have finished this task.", { rate: 1.0 });
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-green-500 items-center justify-center p-6">
            <View className="bg-white p-8 rounded-3xl w-full items-center shadow-lg">
                <Text className="text-6xl mb-4">🎉</Text>
                <Text className="text-3xl font-extrabold text-slate-900 text-center mb-2">Great Job!</Text>
                <Text className="text-xl text-slate-600 text-center mb-8">You finished the task.</Text>

                <TouchableOpacity
                    className="bg-green-600 w-full py-4 rounded-xl"
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <Text className="text-white text-center font-bold text-xl">Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
