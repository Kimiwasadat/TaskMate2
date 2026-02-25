import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachListPlans, coachAssignPlanToClient, getPrototypeEmployees } from '../services/backend';
import { Picker } from '@react-native-picker/picker';

export default function AssignmentScreen({ navigation }) {
    const { user } = useUser();
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');

    useEffect(() => {
        coachListPlans(user.id, user.publicMetadata.role).then(data => {
            const published = data.filter(p => p.isPublished);
            setPlans(published);
            if (published.length > 0) setSelectedPlanId(published[0].id);
        });

        getPrototypeEmployees().then(data => {
            setClients(data);
            if (data.length > 0) setSelectedClientId(data[0].id);
        });
    }, [user]);

    const handleAssign = async () => {
        if (!selectedPlanId) {
            Alert.alert("Error", "Please select a plan.");
            return;
        }
        if (!selectedClientId) {
            Alert.alert("Error", "Please select a client.");
            return;
        }

        setLoading(true);
        try {
            await coachAssignPlanToClient(user.id, user.publicMetadata.role, selectedPlanId, selectedClientId);
            Alert.alert("Success", "Plan assigned to client successfully!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6">
            <View className="flex-row justify-between items-center mb-8">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-slate-500 font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold text-slate-800">Assign Plan</Text>
                <View style={{ width: 50 }} />
            </View>

            <View className="flex-1">
                <Text className="text-slate-700 font-bold mb-2 text-lg">Select Plan</Text>
                <View className="bg-slate-50 border border-slate-200 rounded-xl mb-6 p-2">
                    {/* Primitive dropdown substitution since we don't have standard cross-platform picker installed natively in expo by default */}
                    {plans.length === 0 ? (
                        <Text className="text-slate-400 p-2">No published plans available.</Text>
                    ) : (
                        plans.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={() => setSelectedPlanId(p.id)}
                                className={`p-4 rounded-lg mb-1 ${selectedPlanId === p.id ? 'bg-blue-100 border border-blue-300' : ''}`}
                            >
                                <Text className={`font-medium ${selectedPlanId === p.id ? 'text-blue-800' : 'text-slate-700'}`}>
                                    {p.title}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <Text className="text-slate-700 font-bold mb-2 text-lg">Select Client</Text>
                <Text className="text-slate-500 mb-2 text-sm">Choose an employee from the workspace.</Text>

                <View className="bg-slate-50 border border-slate-200 rounded-xl mb-8 overflow-hidden">
                    <Picker
                        selectedValue={selectedClientId}
                        onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                    >
                        {clients.map(c => (
                            <Picker.Item key={c.id} label={`${c.name} (${c.email})`} value={c.id} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    onPress={handleAssign}
                    disabled={loading || plans.length === 0}
                    className={`py-5 rounded-2xl items-center justify-center ${loading || plans.length === 0 ? 'bg-slate-300' : 'bg-blue-600'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-extrabold text-xl">Confirm Assignment</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
