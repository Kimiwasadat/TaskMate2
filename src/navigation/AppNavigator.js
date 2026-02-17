import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import TaskGuidanceScreen from '../screens/TaskGuidanceScreen';
import TaskCompleteScreen from '../screens/TaskCompleteScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Dashboard"
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="TaskGuidance" component={TaskGuidanceScreen} />
                <Stack.Screen name="TaskComplete" component={TaskCompleteScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
